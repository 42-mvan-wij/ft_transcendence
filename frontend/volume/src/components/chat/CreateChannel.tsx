import { gql, useMutation, useQuery } from "@apollo/client";
import * as i from "../../types/Interfaces";
import { useState } from "react";

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

// TO DO: add checks for existing channel
export default function CreateChannel(props: i.ModalProps & { refetchChannels: () => void }) {
	const [createChannel, { data }] = useMutation(CREATE_CHANNEL);

	const allChannels = getAllChannels();
	console.log(allChannels);

	const onSubmit = async (event: any) => {
		event.preventDefault();
		const form = event.currentTarget;
		const name = form.elements[0].value;
		const member_ids = [props.userId];
		const password = form.elements[1].value;
		const logo = "none";

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
			props.refetchChannels();
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

const GET_ALL_PRIVATE_CHANNELS = gql`
	query All_available_private_channels {
		all_available_private_channels {
			name
		}
	}
`;

const GET_ALL_PUBLIC_CHANNELS = gql`
	query All_available_public_channels {
		all_available_public_channels {
			name
		}
	}
`;

function getAllChannels() {
	const {
		loading: loadingPrivate,
		data: dataPrivate,
		error: errorPrivate,
	} = useQuery(GET_ALL_PRIVATE_CHANNELS);
	const {
		loading: loadingPublic,
		data: dataPublic,
		error: errorPublic,
	} = useQuery(GET_ALL_PUBLIC_CHANNELS);

	if (errorPrivate || errorPublic) {
		console.error("Error loading channels:", { errorPrivate, errorPublic });
		return {};
	}

	if (loadingPrivate || loadingPublic) return <p>Loading...</p>;

	if (dataPrivate && dataPublic) {
		console.log("dataPrivate:", dataPrivate);
		console.log("dataPublic:", dataPublic);
		return dataPrivate.all_available_private_channels.concat(
			dataPublic.all_available_public_channels
		);
	} else {
		console.error("Unexpected data format:", { dataPrivate, dataPublic });
		return {};
	}
}
