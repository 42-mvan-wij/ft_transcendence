import { useState, useRef } from "react";
import "../../styles/style.css";
import { gql, useQuery, useMutation } from "@apollo/client";

const GET_ALL_PRIVATE_CHANNELS = gql`
	query All_available_private_channels {
		all_available_private_channels {
			id
			logo
			name
			members {
				username
			}
		}
	}
`;

const JOIN_PRIVATE_GROUP_CHAT = gql`
	mutation JoinPrivateGroupChat($channelId: String!, $password: String!) {
		joinPrivateGroupChat(channelId: $channelId, password: $password)
	}
`;

export default function PrivateChannel({ setShowModal, refetchChannels }: any) {
	const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
	const { loading, data, error, refetch } = useQuery(GET_ALL_PRIVATE_CHANNELS);
	const [joinPrivateGroupChat, { loading: joinLoading, error: joinError }] =
		useMutation(JOIN_PRIVATE_GROUP_CHAT);

	const [passwords, setPasswords] = useState<{ [key: string]: string }>({});

	async function Join(channelId: string) {
		const password = passwords[channelId] || "";
		try {
			const { data: joinData } = await joinPrivateGroupChat({
				variables: { channelId: channelId, password: password },
			});
			const joinSuccessful = joinData?.joinPrivateGroupChat;

			refetch();
			refetchChannels();
			setShowModal(false);
			if (!joinSuccessful) {
				alert("Wrong password!");
			}
		} catch (error) {
			console.log("Error joining ", error);
		}
	}

	if (data && data.all_available_private_channels.length === 0) return <p>No channels to join</p>;
	if (joinError) return <p>Error: {joinError.message}</p>;
	if (joinLoading) return <p>Joining...</p>;
	if (error) return <p>Error</p>;
	if (loading) return <p>Loading...</p>;

	return (
		<div className="new_chat">
			{data.all_available_private_channels.map((chat: any) => (
				<Channel
					chat={chat}
					selectedChannel={selectedChannel}
					setSelectedChannel={setSelectedChannel}
					passwords={passwords}
					setPasswords={setPasswords}
					Join={Join}
				/>
			))}
		</div>
	);
}

function Channel({
	chat,
	selectedChannel,
	setSelectedChannel,
	passwords,
	setPasswords,
	Join,
}: any) {
	return (
		<div className="chooseChannel">
			<div className="selectUser" onClick={() => setSelectedChannel(chat.id)}>
				<div className="link">{chat.name}</div>
				<div className="unclickable_link">{chat.members.length} members</div>
			</div>
			{selectedChannel === chat.id && (
				<div className="inputField">
					<input
						type="password"
						value={passwords[chat.id] || ""}
						onChange={(e) => setPasswords({ ...passwords, [chat.id]: e.target.value })}
						placeholder="Enter password"
					/>
					<label>
						<button onClick={() => Join(chat.id)}>Join {chat.name}</button>
					</label>
				</div>
			)}
		</div>
	);
}
