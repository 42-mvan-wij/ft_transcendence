import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CURRENT_USER } from "src/utils/graphQLQueries";
import { FORM_MUTATION } from "src/utils/graphQLMutations";
import { convertEncodedImage } from "src/utils/convertEncodedImage";
import "src/styles/style.css";
import { useNavigate } from "react-router-dom";

interface PictureForm {
	filename: string;
	file: string;
}

class FormData {
	constructor(usernameArg: string, imageArg: PictureForm) {
		this.username = usernameArg;
		this.avatar = imageArg;
	}
	username: string;
	avatar: PictureForm;

	isIncomplete(): boolean {
		if (
			this.username == "" ||
			this.avatar == null ||
			this.avatar.filename == "" ||
			this.avatar.file == ""
		) {
			return true;
		}
		return false;
	}
}

export default function NewUserForm({ user }): JSX.Element {
	const navigate = useNavigate();
	const [formMutation, formMutationState] = useMutation(FORM_MUTATION, {
		refetchQueries: [{ query: CURRENT_USER }],
	});

	const [picture, setPicture] = useState<PictureForm>({ filename: "", file: "" });
	const [usernameInput, setUsernameInput] = useState("");
	const [isEmptyForm, setIsEmptyForm] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(usernameInput, picture);

		if (formData.isIncomplete()) {
			setIsEmptyForm(true);
			return;
		} else {
			setIsEmptyForm(false);
		}
		console.log(formData);
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
			setPicture({ filename: fileName, file: imgData });
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
					<h3>Select a profile picture</h3>
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
