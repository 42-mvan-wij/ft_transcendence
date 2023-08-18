import "../../styles/style.css";
import { useState } from "react";
import PrivateChannel from "./JoinPrivate";
import PublicChannel from "./JoinPublic";

export default function JoinChannel(props: any) {
	const [toggleChannel, setToggleChannel] = useState(false);

	return (
		<div className="new_chat">
			<div className="flex_row_spacebetween">
				<a
					style={toggleChannel ? {} : { fontWeight: "bold" }}
					onClick={() => setToggleChannel(false)}
				>
					public channels
				</a>
				<a
					style={toggleChannel ? { fontWeight: "bold" } : {}}
					onClick={() => setToggleChannel(true)}
				>
					private channels
				</a>
			</div>
			{toggleChannel ? (
				<PrivateChannel userId={props.userId} setShowModal={props.setShowModal} />
			) : (
				<PublicChannel userId={props.userId} setShowModal={props.setShowModal} />
			)}
		</div>
	);
}
