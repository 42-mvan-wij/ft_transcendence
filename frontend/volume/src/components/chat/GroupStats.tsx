import "../../styles/style.css";
import UserStats from "../common/UserStats";
import { convertEncodedImage } from "../../utils/convertEncodedImage";
import ChangePrivileges from "./ChangePrivileges";

function GroupStats(props: any) {
	console.log(props.selectedGroup);
	console.log(props.selectedGroup.banned_users);
	return (
		<div className="userStats">
			<h1>{props.selectedGroup.name}</h1>
			<RenderActions
				{...props}
				group={props.selectedGroup}
				refetchChannel={props.refetchChannel}
			/>
			<br />
			<h2>Group members</h2>
			<RenderFriendsList {...props} />
		</div>
	);
}

function RenderActions(props: any) {
	const userIsAdmin = props.selectedGroup.admins.some((admin: any) => admin.id === props.userId);
	const isPrivateChannel = !props.selectedGroup.isPublic;
	const actions = [];
	console.log("RenderActions", typeof props.refetchChannel);

	if (isPrivateChannel || userIsAdmin)
		actions.push(
			<a
				className="link"
				key="change_privileges"
				onClick={() =>
					props.toggleModal(
						<ChangePrivileges
							{...props}
							group={props.group}
							refetchChannel={props.refetchChannel}
						/>
					)
				}
			>
				change user privileges
			</a>
		);

	if (isPrivateChannel && userIsAdmin)
		actions.push(
			<a className="link" key="pw">
				change password
			</a>
		);

	actions.push(
		<a className="link" key="leave">
			leave group
		</a>
	);

	return (
		<div className="user_actions">
			<h1>{props.group.groupname}</h1>
			{actions}
		</div>
	);
}

function RenderFriendsList(props: any) {
	const members = props.selectedGroup.members;
	return (
		<div className="friend_list">
			{members.map(function (member: any) {
				return (
					<div className="friends_avatar_container" key={member.id}>
						<img
							onClick={() =>
								props.toggleModal(<UserStats {...props} selectedUser={member} />)
							}
							src={convertEncodedImage(member.avatar.file)}
						/>
					</div>
				);
			})}
		</div>
	);
}

export default GroupStats;
