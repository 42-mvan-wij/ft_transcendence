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
						blocked_by_me
					}
					channel {
						id
					}
					content
					dateSent
				}
				... on PersonalMessage {
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
								...old_group_chat.lastMessage?.author,
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

	const allChats = getAllChats(data, props.userId);

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

function getAllChats(data: any, userId: string) {
	// merge personal and group chats
	let allChats = data.currentUserQuery.personal_chats.concat(data.currentUserQuery.group_chats);

	// if chat has no logo(and therefor is personal chat), use the other member's name and avatar
	// TODO: move back to backend
	allChats = allChats.map((chat: any) => {
		const newChat = { ...chat };
		if (!newChat.logo) {
			newChat.logo =
				userId === newChat.members[0]
					? newChat.members[0]?.avatar.file
					: newChat.members[1]?.avatar.file;
		}
		return newChat;
	});

	// sort by dateSent
	allChats.sort(function (a: any, b: any) {
		const dateA = a.lastMessage?.dateSent ? Date.parse(a.lastMessage.dateSent) : 0;
		const dateB = b.lastMessage?.dateSent ? Date.parse(b.lastMessage.dateSent) : 0;
		return dateB - dateA;
	});

	return allChats;
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
