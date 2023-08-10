import { convertEncodedImage } from "../../utils/convertEncodedImage";
import { gql, useMutation } from "@apollo/client";

const createMutation = (operation: any) => gql`
  mutation ${operation}($channelId: String!, $userId: String!) {
    ${operation.toLowerCase()}(channel_id: $channelId, user_id: $userId) {
      id
    }
  }
`;

const PROMOTE_ADMIN = createMutation("Promote");
const DEMOTE_ADMIN = createMutation("Demote");
const KICK_MEMBER = createMutation("Kick");
const BAN_MEMBER = createMutation("Ban");
const UNBAN_MEMBER = createMutation("Unban");
const MUTE_MEMBER = createMutation("Mute");
const UNMUTE_MEMBER = createMutation("Unmute");

export default function ChangePrivileges(props: any) {
	const members = props.group.members.filter(
		(member: any) => member.id != props.userId && member.id != props.group.owner
	);
	console.log("ChangePrivileges", typeof props.refetchChannel);

	if (members.length === 0)
		return (
			<div className="userStats">
				<h1>{props.group.name}</h1>No actions available
			</div>
		);
	return (
		<div className="userStats">
			<h1>{props.group.name}</h1>
			<div className="change_privileges">
				{members.map(function (member: any) {
					return (
						<div className="privileges_row" key={"users" + member.id}>
							<div className="friends_avatar_container">
								<img src={convertEncodedImage(member.avatar.file)} />
							</div>
							<div className="name">{member.username}</div>
							{adminPrivileges(props.group, member, props.refetchChannel)}
							{kickUser(props.group, member, props.refetchChannel)}
							{banUser(props.group, member, props.refetchChannel)}
							{muteUser(props.group, member, props.refetchChannel)}
						</div>
					);
				})}
				{props.group.banned_users.map(function (member: any) {
					return (
						<div className="privileges_row" key={"banned" + member.id}>
							<div className="friends_avatar_container">
								<img src={convertEncodedImage(member.avatar.file)} />
							</div>
							<div className="name">{member.username}</div>
							<div className="unclickable_link admin">make admin</div>
							<div className="unclickable_link">kick</div>
							{banUser(props.group, member, props.refetchChannel)}
							<div className="unclickable_link mute">mute</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function adminPrivileges(group: any, member: any, refetchChannel: () => void) {
	const memberIsAdmin = group.admins.some((admin: any) => admin.id === member.id);

	const [promoteAdminMutation] = useMutation(PROMOTE_ADMIN);
	const [demoteAdminMutation] = useMutation(DEMOTE_ADMIN);
	console.log(typeof refetchChannel);

	function handleAdminAction(): void {
		const mutation = memberIsAdmin ? demoteAdminMutation : promoteAdminMutation;
		mutation({
			variables: {
				channelId: group.id,
				userId: member.id,
			},
		});
		console.log(typeof refetchChannel);

		refetchChannel();
	}
	const linkText = memberIsAdmin ? "remove admin" : "make admin";
	return (
		<div className="link admin" onClick={handleAdminAction}>
			{linkText}
		</div>
	);
}

function kickUser(group: any, member: any, refetchChannel: () => void) {
	const [kickMemberMutation] = useMutation(KICK_MEMBER);
	function kickMember(): void {
		kickMemberMutation({
			variables: {
				channelId: group.id,
				userId: member.id,
			},
		});
	}
	return (
		<div className="link" onClick={kickMember}>
			kick
		</div>
	);
}

function banUser(group: any, member: any, refetchChannel: () => void) {
	const memberIsBanned = group.banned_users.some((user: any) => user.id === member.id);

	const [banMemberMutation] = useMutation(BAN_MEMBER);
	const [unbanMemberMutation] = useMutation(UNBAN_MEMBER);

	function handleBanAction(): void {
		const mutation = memberIsBanned ? unbanMemberMutation : banMemberMutation;
		mutation({
			variables: {
				channelId: group.id,
				userId: member.id,
			},
		});
		refetchChannel();
	}
	const linkText = memberIsBanned ? "unban" : "ban";
	return (
		<div className="link ban" onClick={handleBanAction}>
			{linkText}
		</div>
	);
}

function muteUser(group: any, member: any, refetchChannel: () => void) {
	const memberIsBanned = group.banned_users.some((user: any) => user.id === member.id);

	const [banMemberMutation] = useMutation(MUTE_MEMBER);
	const [unbanMemberMutation] = useMutation(UNMUTE_MEMBER);

	function handleBanAction(): void {
		const mutation = memberIsBanned ? unbanMemberMutation : banMemberMutation;
		mutation({
			variables: {
				channelId: group.id,
				userId: member.id,
			},
		});
		refetchChannel();
	}
	const linkText = memberIsBanned ? "unmute" : "mute";
	return (
		<div className="link mute" onClick={handleBanAction}>
			{linkText}
		</div>
	);
}
