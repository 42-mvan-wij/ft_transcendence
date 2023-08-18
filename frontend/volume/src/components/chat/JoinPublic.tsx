import "../../styles/style.css";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useEffect } from "react";
import useChannelCreatedSubscription from "src/utils/useChannelsCreatedSub";

const GET_ALL_PUBLIC_CHANNELS = gql`
	query {
		all_available_public_channels {
			id
			name
			logo
			members {
				username
			}
			banned_users {
				id
			}
		}
	}
`;

const JOIN_GROUP_CHAT = gql`
	mutation JoinGroupChat($channelId: String!) {
		joinGroupChat(channelId: $channelId) {
			id
			name
			logo
			members {
				username
			}
		}
	}
`;

export default function PublicChannel({
	userId,
	setShowModal,
}: {
	userId: string;
	setShowModal: any;
}) {
	const { loading, data, error, refetch } = useQuery(GET_ALL_PUBLIC_CHANNELS);
	const [joinGroupChat, { loading: joinLoading, error: joinError }] =
		useMutation(JOIN_GROUP_CHAT);

	// refetch when a new channel is created
	const { channelCreated } = useChannelCreatedSubscription();
	useEffect(() => {
		if (channelCreated) refetch();
	}, [channelCreated, refetch]);

	// refetch when page is loaded
	useEffect(() => {
		refetch();
	}, [refetch]);

	async function Join(channelId: string) {
		try {
			await joinGroupChat({
				variables: { channelId: channelId },
			});
			refetch();
			setShowModal(false);
		} catch (error) {
			console.log("Error joining ", error);
		}
	}

	if (data && data.all_available_public_channels.length === 0) return <p>No channels to join</p>;
	if (joinError) return <p>{joinError.message}</p>;
	if (joinLoading) return <p>Joining...</p>;

	if (error) return <></>;
	if (loading) return <p>Loading...</p>;
	const filteredChannels = data.all_available_public_channels.filter((channel: any) => {
		const bannedUsers = channel.banned_users;
		if (bannedUsers) {
			for (let i = 0; i < bannedUsers.length; i++)
				if (bannedUsers[i].id === userId) return false;
		}
		return true;
	});
	return (
		<div className="new_chat">
			{filteredChannels.map(function (chat: any) {
				return (
					<div key={chat.id} className="selectUser">
						<button onClick={() => Join(chat.id)}>Join {chat.name}</button>
					</div>
				);
			})}
		</div>
	);
}
