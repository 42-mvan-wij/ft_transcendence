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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [changePassword, { data }] = useMutation(CHANGE_PASSWORD);
	const [old_password, setOldPassword] = useState("");
	const [new_password, setNewPassword] = useState("");

	async function ChangePW(channelId: string, oldPassword: string, newPassword: string) {
		if (newPassword.length === 0 || newPassword.length > 16) {
			alert("Password length has to be at least 1 and maximum 16 characters");
		} else {
			const check: any = await changePassword({
				variables: { channelId, oldPassword, newPassword },
			});
			if (check.data.changePassword === null) {
				alert("Cannot change password, please go back to chat overview");
			} else {
				const passwordCorrect = check.data.changePassword;
				alert(passwordCorrect ? "Password changed!" : "Incorrect password!");
			}
		}
		props.setShowModal(false);
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
