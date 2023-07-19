import { useState } from "react";
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

export default function PrivateChannel({
	setShowModal,
	refetchChannels,
}: {
	setShowModal: (showModal: boolean) => void;
	refetchChannels: () => void;
}) {
	const { loading, data, error, refetch } = useQuery(GET_ALL_PRIVATE_CHANNELS);
	const [joinPrivateGroupChat, { loading: joinLoading, error: joinError }] =
		useMutation(JOIN_PRIVATE_GROUP_CHAT);

	const [password, setPassword] = useState("");
	async function Join(channelId: string) {
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
			<input
				type="text"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Enter password"
			/>
			{data.all_available_private_channels.map(function (chat: any) {
				return (
					<div key={chat.id} className="selectUser">
						<img className="avatar" src={chat.logo} />
						<label>
							<button onClick={() => Join(chat.id)}>Join {chat.name}</button>
						</label>
					</div>
				);
			})}
		</div>
	);
}
