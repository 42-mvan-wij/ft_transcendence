import { useState } from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import { FORM_MUTATION } from "src/utils/graphQLMutations";
import { convertEncodedImage } from "src/utils/convertEncodedImage";
import { PictureForm, FormData } from "./FormData";
import "src/styles/style.css";
import { gqlErrorCode } from "src/utils/gqlErrorData";

export default function ProfileForm({ user }: { user: any }): JSX.Element {
	const [formMutation] = useMutation(FORM_MUTATION, {
		refetchQueries: [{ query: CURRENT_USER }],
	});

	const [picture, setPicture] = useState<PictureForm>({ filename: "", file: user.avatar.file });
	const [usernameInput, setUsernameInput] = useState("");
	const [isEmptyForm, setIsEmptyForm] = useState(false);
	const [fileTooBig, setFileTooBig] = useState(false);
	const [preexistingUsername, setPreexistingUsername] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(usernameInput, picture);

		if (formData.isEmpty()) {
			setIsEmptyForm(true);
			return;
		} else {
			setIsEmptyForm(false);
		}

		const result = formMutation({
			variables: {
				input: formData,
			},
		});
		result.then(
			() => {
				setPreexistingUsername(false);
				setFileTooBig(false);
				alert("Profile updated!");
				return;
			},
			(error: ApolloError) => {
				if (error.networkError) setFileTooBig(true);
				if (gqlErrorCode(error) == "PREEXISTING_USERNAME") {
					setPreexistingUsername(true);
				}
			}
		);
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setUsernameInput(event.currentTarget.value);
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!event.target.files) return;
		if (!event.target.files[0]) {
			setPicture({ filename: "", file: user.avatar.file });
			return;
		}
		const fileReader = new FileReader();
		const file = event.target.files[0];
		const fileName = file.name;

		fileReader.onloadend = (e: any) => {
			const fileContent = e.currentTarget.result as string;
			const imgData = window.btoa(fileContent);
			setPicture({ filename: fileName, file: imgData });
		};
		fileReader.readAsBinaryString(file);
	};
	return (
		<form className="profile_form" method="post" onSubmit={handleSubmit}>
			{isEmptyForm && <p className="empty-form-message">Please fill in at least one field</p>}
			<h3>Profile Picture </h3>
			<div className="change_avatar">
				<div className="avatar_container">
					<img src={convertEncodedImage(picture.file)} alt="error no image" />
				</div>
				<label className="choose_file" htmlFor="changeAvatar">
					<input
						id="changeAvatar"
						type="file"
						name="profilePicture"
						accept="image/png, image/gif, image/jpeg"
						onChange={handleFileChange}
					/>
					<h3>Select a new image</h3>
					{fileTooBig && (
						<p className="empty-form-message">The selected image is too big</p>
					)}
				</label>
			</div>
			<label htmlFor="name">
				<h3>Username</h3>
				<input
					type="text"
					name="username"
					placeholder={user.username}
					minLength={2}
					maxLength={15}
					onChange={handleChange}
				/>
				{preexistingUsername && (
					<p className="empty-form-message">Username already in use</p>
				)}
			</label>
			<button className="submit_button" type="submit">
				Save Profile
			</button>
		</form>
	);
}
