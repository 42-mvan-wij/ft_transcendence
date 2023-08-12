import { convertEncodedImage } from "../../utils/convertEncodedImage";
import { gql, useMutation } from "@apollo/client";
import { useEffect } from "react";
import { goBackToGroupStats } from "./GroupStats";

export default function ChangePassword(props: any) {
	function ChangePW(chatId: string) {
		console.log("ChangePW");
		try {
			// const { data: joinData } = await joinPrivateGroupChat({
			// variables: { channelId: channelId, password: password },
			// });
			props.setShowModal(false);
			const joinSuccessful = true;
			alert(joinSuccessful ? "Password changed!" : "Incorrect password!");

			// const joinSuccessful = joinData?.joinPrivateGroupChat;
			// console.log("joinData ", joinData);
		} catch (error) {
			console.log("Error joining ", error);
		}
	}
	return (
		<div className="userStats">
			<h1>{props.group.name}</h1>
			<div className="inputField">
				<input
					type="password"
					// value={passwords[chat.id] || ""}
					// onChange={(e) => setPasswords({ ...passwords, [chat.id]: e.target.value })}
					placeholder="Old password"
				/>
				<input
					type="password"
					// value={passwords[chat.id] || ""}
					// onChange={(e) => setPasswords({ ...passwords, [chat.id]: e.target.value })}
					placeholder="New password"
				/>
				<label>
					<button onClick={() => ChangePW(props.group.id)}>Change Password</button>
				</label>
			</div>
			{goBackToGroupStats(props)}
		</div>
	);
}
