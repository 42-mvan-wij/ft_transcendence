import { gql, useMutation, useQuery } from "@apollo/client";
import { AVATAR_GROUPCHAT } from "../../utils/constants";

const CREATE_CHANNEL = gql`
	mutation CreateChannel(
		$name: String!
		$logo: String!
		$member_ids: [String!]!
		$password: String!
	) {
		createGroupChat(name: $name, logo: $logo, member_ids: $member_ids, password: $password) {
			id
			name
		}
	}
`;

export default function CreateChannel(props: any) {
	const [createChannel] = useMutation(CREATE_CHANNEL);

	const allChannels = getAllChannels();

	const onSubmit = async (event: any) => {
		event.preventDefault();
		const form = event.currentTarget;
		const name = form.elements[0].value;
		const member_ids = [props.userId];
		const password = form.elements[1].value;
		const logo = AVATAR_GROUPCHAT;

		if (!name || !logo || member_ids.length === 0) {
			alert("All fields are required");
			return;
		}

		if (allChannels.some((channel: any) => channel.name === name)) {
			alert("There already exists a channel with this name");
			return;
		}

		try {
			await createChannel({ variables: { name, logo, member_ids, password } });
			props.setShowModal(false);
		} catch (error) {
			console.log("Error joining ", error);
		}
	};

	return (
		<div className="new_chat">
			<form onSubmit={onSubmit}>
				<h3>Name</h3>
				<input type="text" placeholder="Channel Name"></input>
				<br />
				<br />
				<h3>Password</h3>
				<input type="password" placeholder="leave blank to create public channel"></input>
				<button type="submit">Create channel</button>
			</form>
		</div>
	);
}

const GET_ALL_CHANNELS = gql`
	query All_group_chats {
		all_group_chats {
			name
		}
	}
`;

function getAllChannels() {
	const { loading, data, error } = useQuery(GET_ALL_CHANNELS);

	if (error) return {};
	if (loading) return "Loading...";

	return data.all_group_chats;
}
