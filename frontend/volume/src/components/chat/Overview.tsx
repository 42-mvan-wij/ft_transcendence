import "../../styles/style.css";
import * as i from "../../types/Interfaces";
import { ChatState } from "../../utils/constants";
import { gql, useQuery } from "@apollo/client";
import { convertEncodedImage } from "src/utils/convertEncodedImage";
import JoinChannel from "./JoinChannel";
import CreateChannel from "./CreateChannel";
import NewChat from "./NewChat";
import { useEffect, useState } from "react";

const GET_CHANNELS = gql`
	query GetChannels {
		currentUserQuery {
			id
			personal_chats {
				id
				name
				logo
				lastMessage {
					author {
						id
						blocked_by_me
					}
					content
					dateSent
				}
				members {
					id
					username
				}
			}
			group_chats {
				id
				name
				logo
				lastMessage {
					author {
						id
						blocked_by_me
					}
					content
					dateSent
				}
				isPublic
				members {
					id
					username
					avatar {
						file
					}
				}
			}
		}
	}
`;

const MESSAGE_SUBSCRIPTION = gql`
	subscription messageReceived {
		message_received {
			message {
				... on GroupMessage {
					author {
						id
						blocked_by_me
					}
					channel {
						id
					}
					content
					dateSent
				}
				... on PersonalMessage {
					author {
						id
						blocked_by_me
					}
					channel {
						id
					}
					content
					dateSent
				}
			}
			type
		}
	}
`;

const SUBSCRIBE_BLOCK = gql`
	subscription BlockStateChanged($user_ids: [String!]!) {
		multi_block_state_changed(user_ids: $user_ids) {
			user_id
			blocked
		}
	}
`;

enum MessageType {
	GROUP,
	PERSONAL,
}

function Overview({
	props,
	setSelectedChannel,
	setChatState,
}: {
	props: i.ModalProps;
	setSelectedChannel: (channel_id: string) => void;
	setChatState: (state: ChatState) => void;
}) {
	const [dataFresh, setDataFresh] = useState(false);
	const { loading, error, data, refetch, subscribeToMore } = useQuery(GET_CHANNELS);

	useEffect(() => {
		return subscribeToMore({
			document: MESSAGE_SUBSCRIPTION,
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData.data) return prev;
				const message_received = subscriptionData.data.message_received;
				if (message_received.type === MessageType.GROUP) {
					const group_chat_index = prev.currentUserQuery.group_chats.findIndex(
						(gc: any) => gc.id === message_received.message.channel.id
					);
					const old_group_chat = prev.currentUserQuery.group_chats[group_chat_index];
					const new_group_chat = Object.assign({}, old_group_chat, {
						lastMessage: {
							...old_group_chat.lastMessage,
							author: {
								...old_group_chat.lastMessage.author,
								id: message_received.message.author.id,
								blocked_by_me: message_received.message.author.blocked_by_me,
							},
							content: message_received.message.content,
							dateSent: message_received.message.dateSent,
						},
					});
					return Object.assign({}, prev, {
						currentUserQuery: {
							...prev.currentUserQuery,
							group_chats: [
								...prev.currentUserQuery.group_chats.slice(0, group_chat_index),
								new_group_chat,
								...prev.currentUserQuery.group_chats.slice(group_chat_index + 1),
							],
						},
					});
				} else if (message_received.type === MessageType.PERSONAL) {
					const personal_chat_index = prev.currentUserQuery.personal_chats.findIndex(
						(pc: any) => pc.id === message_received.message.channel.id
					);
					const old_personal_chat =
						prev.currentUserQuery.personal_chats[personal_chat_index];
					const new_personal_chat = Object.assign({}, old_personal_chat, {
						lastMessage: {
							...old_personal_chat.lastMessage,
							author: {
								...old_personal_chat.lastMessage.author,
								id: message_received.message.author.id,
								blocked_by_me: message_received.message.author.blocked_by_me,
							},
							content: message_received.message.content,
							dateSent: message_received.message.dateSent,
						},
					});
					return Object.assign({}, prev, {
						currentUserQuery: {
							...prev.currentUserQuery,
							group_chats: [
								...prev.currentUserQuery.group_chats.slice(0, personal_chat_index),
								new_personal_chat,
								...prev.currentUserQuery.group_chats.slice(personal_chat_index + 1),
							],
						},
					});
				}
				return prev;
			},
		});
	}, []);

	useEffect(() => {
		if (!data) return;
		const group_members = data.currentUserQuery.group_chats.flatMap((group_chat: any) =>
			group_chat.members.map((member: any) => member.id)
		);
		const personal_members = data.currentUserQuery.personal_chats.flatMap(
			(personal_chat: any) => personal_chat.members.map((member: any) => member.id)
		);
		const members = [...new Set([...group_members, ...personal_members])];
		return subscribeToMore({
			document: SUBSCRIBE_BLOCK,
			variables: {
				user_ids: members,
			},
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData.data) return prev;
				const block_update = subscriptionData.data.multi_block_state_changed;
				console.log({ block_update });
				const new_group_chats = [];
				for (const group_chat of prev.currentUserQuery.group_chats) {
					if (group_chat.lastMessage?.author?.id === block_update.user_id) {
						new_group_chats.push(
							Object.assign({}, group_chat, {
								lastMessage: {
									...group_chat.lastMessage,
									author: {
										...group_chat.lastMessage.author,
										blocked_by_me: block_update.blocked,
									},
								},
							})
						);
					} else {
						new_group_chats.push(group_chat);
					}
				}
				const new_personal_chats = [];
				for (const personal_chat of prev.currentUserQuery.personal_chats) {
					if (personal_chat.lastMessage?.author?.id === block_update.user_id) {
						new_personal_chats.push(
							Object.assign({}, personal_chat, {
								lastMessage: {
									...personal_chat.lastMessage,
									author: {
										...personal_chat.lastMessage.author,
										blocked_by_me: block_update.blocked,
									},
								},
							})
						);
					} else {
						new_personal_chats.push(personal_chat);
					}
				}
				return Object.assign({}, prev, {
					currentUserQuery: {
						...prev.currentUserQuery,
						group_chats: new_group_chats,
						personal_chats: new_personal_chats,
					},
				});
			},
		});
	}, [loading]);

	const refetchChannels = () => {
		refetch();
	};

	if (dataFresh == false) {
		setDataFresh(true);
		refetchChannels();
	}

	if (error) return <p>Error: {error.message}</p>;
	if (loading) return <p>Loading...</p>;

	function renderChat(channel_id: string, isPublic?: boolean) {
		setDataFresh(false);
		setSelectedChannel(channel_id);
		if (isPublic === undefined) setChatState(ChatState.personalMessage);
		else setChatState(ChatState.groupMessage);
	}

	// merge personal and group chats
	let allChats = data.currentUserQuery.personal_chats.concat(data.currentUserQuery.group_chats);

	// if chat has no name(and therefor is personal chat), use the other member's name and avatar
	// TODO: move back to backend
	allChats = allChats.map((chat: any) => {
		const newChat = { ...chat };
		if (!newChat.logo) {
			newChat.logo =
				props.userId === newChat.members[0]
					? newChat.members[0].avatar.file
					: newChat.members[1].avatar.file;
		}
		return newChat;
	});

	// sort by dateSent
	allChats.sort(function (a: any, b: any) {
		if (a.lastMessage?.dateSent && b.lastMessage?.dateSent) {
			return Date.parse(b.lastMessage.dateSent) - Date.parse(a.lastMessage.dateSent);
		}
	});

	return (
		<>
			<div className="overview_wrapper">
				{allChats.map((chat: any) => {
					return (
						<div
							className="chat_container"
							key={chat.id + "_key"}
							onClick={() => renderChat(chat.id, chat.isPublic)}
						>
							<div className="avatar_container">
								<img src={convertEncodedImage(chat.logo)}></img>
							</div>
							<div className="wrap_name_message">
								<div className="flex_row_spacebetween">
									<h3 className="name">{chat.name}</h3>
									<div className="status">online</div>
								</div>
								<div className="chat_preview">
									{chat.lastMessage?.author?.blocked_by_me
										? "This message was blocked"
										: chat.lastMessage?.content ?? ""}
								</div>
							</div>
						</div>
					);
				})}
			</div>
			{renderNewChatOptions({ props, refetchChannels })}
		</>
	);
}

function renderNewChatOptions({
	props,
	refetchChannels,
}: {
	props: i.ModalProps;
	refetchChannels: () => void;
}) {
	return (
		<div className="new_chat flex_row_spacebetween">
			<a
				onClick={() =>
					props.toggleModal(
						<NewChat
							setShowModal={props.setShowModal}
							refetchChannels={refetchChannels}
						/>
					)
				}
			>
				new chat
			</a>
			<a
				onClick={() =>
					props.toggleModal(<JoinChannel {...props} refetchChannels={refetchChannels} />)
				}
			>
				join channel
			</a>
			<a
				onClick={() =>
					props.toggleModal(
						<CreateChannel {...props} refetchChannels={refetchChannels} />
					)
				}
			>
				create channel
			</a>
		</div>
	);
}

export default Overview;
