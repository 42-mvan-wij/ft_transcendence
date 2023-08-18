import "../../styles/style.css";
import { convertEncodedImage } from "../../utils/convertEncodedImage";
import { gql, useMutation } from "@apollo/client";
import { ChatState } from "../../utils/constants";

export default function GroupStats(props: any) {
	return (
		<div className="userStats">
			<h1>{props.selectedGroup.name}</h1>
			<RenderActions {...props} setChatState={props.setChatState} />
			<br />
			<h2>Group members</h2>
			<RenderFriendsList {...props} />
		</div>
	);
}

const LEAVE_GROUP_CHAT = gql`
	mutation LeaveGroupChat($channelId: String!) {
		leaveGroupChat(channel_id: $channelId) {
			id
		}
	}
`;

function RenderActions(props: any) {
	const userIsAdmin = props.selectedGroup.admins.some((admin: any) => admin.id === props.userId);
	const userIsOwner = props.selectedGroup.owner.id === props.userId;
	const isPrivateChannel = !props.selectedGroup.isPublic;
	const actions = [];

	if (userIsAdmin)
		actions.push(
			<a
				className="link"
				key="change_privileges"
				onClick={() =>
					props.toggleModal({
						type: "ChangePrivileges",
						setChatState: props.setChatState,
					})
				}
			>
				change user privileges
			</a>
		);

	if (isPrivateChannel && userIsOwner)
		actions.push(
			<a
				className="link"
				key="pw"
				onClick={() =>
					props.toggleModal({
						type: "ChangePassword",
						group: props.group,
					})
				}
			>
				change password
			</a>
		);

	const [LeaveGroupChat, { loading, error }] = useMutation(LEAVE_GROUP_CHAT);
	if (loading) return <>Loading</>;
	if (error) return <></>;

	async function Leave(channelId: string) {
		const { data } = await LeaveGroupChat({
			variables: { channelId: channelId },
		});
		if (!data.leaveGroupChat) {
			alert("Cannot leave channel, please go back to chat overview");
			props.setShowModal(false);
			return;
		}
		props.setShowModal(false);
		props.setChatState(ChatState.overview);
	}
	actions.push(
		<a className="link" key="leave" onClick={() => Leave(props.selectedGroup.id)}>
			leave group
		</a>
	);

	return (
		<div className="user_actions">
			<h1>{props.selectedGroup.groupname}</h1>
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
								props.toggleModal({
									type: "UserStats",
									selectedUser: member,
								})
							}
							src={convertEncodedImage(member.avatar.file)}
						/>
					</div>
				);
			})}
		</div>
	);
}

export function goBackToGroupStats(props: any) {
	return (
		<>
			<br />
			<br />
			<div
				className="link"
				onClick={() =>
					props.toggleModal({
						type: "GroupStats",
						setChatState: props.setChatState,
					})
				}
			>
				back to options
			</div>
		</>
	);
}
