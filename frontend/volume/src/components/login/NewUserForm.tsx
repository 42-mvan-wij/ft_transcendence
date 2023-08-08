import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import { FORM_MUTATION } from "src/utils/graphQLMutations";
import { convertEncodedImage } from "src/utils/convertEncodedImage";
import "src/styles/style.css";
import { useNavigate } from "react-router-dom";

interface PictureForm {
	name: string;
	data: string;
}

export default function NewUserForm({ user }): JSX.Element {
	const navigate = useNavigate();
	const [formMutation, formMutationState] = useMutation(FORM_MUTATION, {
		refetchQueries: [{ query: CURRENT_USER }],
	});

	const [picture, setPicture] = useState<PictureForm>({ name: "", data: "" });
	const [usernameInput, setUsernameInput] = useState("");
	const [isEmptyForm, setIsEmptyForm] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = {};

		formData["username"] = usernameInput;
		formData["avatar"] = {
			file: picture.data,
			filename: picture.name,
		};
		console.log(formData["username"]);
		if (formData["username"] == "" || formData["avatar"] == { file: "", filename: "" }) {
			setIsEmptyForm(true);
			return;
		} else {
			setIsEmptyForm(false);
		}

		formMutation({
			variables: {
				input: formData,
			},
		});
		navigate("/home");
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setUsernameInput(event.currentTarget.value);
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!event.target.files) throw new Error();
		const fileReader = new FileReader();
		const file = event.target.files[0];
		const fileName = file.name;

		fileReader.onloadend = (e: any) => {
			const fileContent = e.currentTarget.result as string;
			const imgData = window.btoa(fileContent);
			setPicture({ name: fileName, data: imgData });
		};
		fileReader.readAsBinaryString(file);
	};

	return (
		<form className="profile_form" method="post" onSubmit={handleSubmit}>
			{isEmptyForm && <p className="empty-form-message">Please fill all fields</p>}
			<h3>Profile Picture </h3>
			<div className="change_avatar">
				<div className="avatar_container">
					<img src={convertEncodedImage(picture.data)} alt="error no image" />
				</div>
				<label className="choose_file" htmlFor="changeAvatar">
					<input
						id="changeAvatar"
						type="file"
						name="profilePicture"
						onChange={handleFileChange}
					/>
					<h3>Select a new image</h3>
				</label>
			</div>
			<label htmlFor="name">
				<h3>Username</h3>
				<input type="text" name="username" onChange={handleChange} />
			</label>
			<button className="submit_button" type="submit">
				Save Profile
			</button>
		</form>
	);
}
