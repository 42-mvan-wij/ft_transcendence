import { gql, useMutation } from "@apollo/client";
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
// TO DO: let user upload image for channel logo
export default function CreateChannel(props: i.ModalProps & { refetchChannels: () => void }) {
	const [createChannel, { data }] = useMutation(CREATE_CHANNEL);

	const onSubmit = async (event: any) => {
		event.preventDefault();
		const form = event.currentTarget;
		const name = form.elements[0].value;
		const logo = form.elements[1].value;
		const member_ids = [props.userId];
		const password = form.elements[2].value;

		if (!name || !logo || member_ids.length === 0) {
			alert("All fields are required");
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
				<h3>Chat picture</h3>
				<div className="flex_row_spacebetween">
					<label className="choose_file" htmlFor="channelPicture">
						<input id="channelPicture" type="file" name="channelPicture" />
						<h3>Upload an image</h3>
					</label>
				</div>
				<h3>Password</h3>
				<input type="password" placeholder="leave blank to create public channel"></input>
				<button type="submit">Create channel</button>
			</form>
		</div>
	);
}
