import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { goBackToGroupStats } from "./GroupStats";

const CHANGE_PASSWORD = gql`
	mutation ChangePassword($channelId: String!, $oldPassword: String!, $newPassword: String!) {
		changePassword(
			channel_id: $channelId
			old_password: $oldPassword
			new_password: $newPassword
		)
	}
`;

export default function ChangePassword(props: any) {
	const [changePassword, { data }] = useMutation(CHANGE_PASSWORD);
	const [old_password, setOldPassword] = useState("");
	const [new_password, setNewPassword] = useState("");

	async function ChangePW(channelId: string, oldPassword: string, newPassword: string) {
		try {
			if (newPassword.length === 0 || newPassword.length > 16) {
				alert("Password length has to be between 1 and 16 characters");
			} else {
				const check: any = await changePassword({
					variables: { channelId, oldPassword, newPassword },
				});
				const passwordCorrect = check.data.changePassword;
				alert(passwordCorrect ? "Password changed!" : "Incorrect password!");
			}
			props.setShowModal(false);
		} catch (error) {
			console.log("Error changing password ", error);
		}
	}
	return (
		<div className="userStats">
			<h1>{props.selectedGroup.name}</h1>
			<div className="inputField">
				<input
					type="password"
					value={old_password}
					onChange={(e) => setOldPassword(e.target.value)}
					placeholder="Old password"
				/>
				<input
					type="password"
					value={new_password}
					onChange={(e) => setNewPassword(e.target.value)}
					placeholder="New password"
				/>
				<label>
					<button
						onClick={() => ChangePW(props.selectedGroup.id, old_password, new_password)}
					>
						Change Password
					</button>
				</label>
			</div>
			{goBackToGroupStats(props)}
		</div>
	);
}
