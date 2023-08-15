import { convertEncodedImage } from "../../utils/convertEncodedImage";
import { gql, useMutation } from "@apollo/client";
import { goBackToGroupStats } from "./GroupStats";

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

const MUTE_MEMBER = gql`
	mutation Mute($channelId: String!, $userId: String!, $timeout: Float!) {
		mute(channel_id: $channelId, user_id: $userId, timeout: $timeout) {
			id
		}
	}
`;

// const UNMUTE_MEMBER = createMutation("Unmute");

export default function ChangePrivileges(props: any) {
	console.log(props.group.owner);

	let members = props.group.members.filter(
		(member: any) => member.id != props.userId && member.id != props.group.owner.id
	);

	const userIsOwner = props.group.owner.id === props.userId;
	if (!userIsOwner)
		members = members.filter(
			(member: any) => !props.group.admins.some((admin: any) => admin.id === member.id)
		);

	if (members.length === 0 && props.group.banned_users.length === 0)
		return (
			<div className="userStats">
				<h1>{props.group.name}</h1>No actions available
				{goBackToGroupStats(props)}
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
							<AdminPrivileges
								{...props}
								member={member}
								refetchChannel={props.refetchChannel}
							/>
							<KickUser
								{...props}
								member={member}
								refetchChannel={props.refetchChannel}
							/>
							<BanUser
								{...props}
								member={member}
								refetchChannel={props.refetchChannel}
							/>
							<MuteUser
								{...props}
								member={member}
								refetchChannel={props.refetchChannel}
							/>
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
							<BanUser
								{...props}
								member={member}
								refetchChannel={props.refetchChannel}
							/>
							<div className="unclickable_link mute">mute</div>
						</div>
					);
				})}
			</div>
			{goBackToGroupStats(props)}
		</div>
	);
}

function AdminPrivileges(props: any) {
	const memberIsAdmin = props.group.admins.some((admin: any) => admin.id === props.member.id);

	const [promoteAdminMutation] = useMutation(PROMOTE_ADMIN);
	const [demoteAdminMutation] = useMutation(DEMOTE_ADMIN);

	async function handleAdminAction(): Promise<void> {
		const mutation = memberIsAdmin ? demoteAdminMutation : promoteAdminMutation;

		try {
			await mutation({
				variables: {
					channelId: props.group.id,
					userId: props.member.id,
				},
			});
			await props.refetchChannel();
			const alertMsg = memberIsAdmin ? " is no longer admin" : " is now admin";
			alert(props.member.username + alertMsg);
			props.setShowModal(false);
		} catch (error) {
			console.error("An error occurred while handling the admin action:", error);
		}
	}

	return (
		<div className="link admin" onClick={handleAdminAction}>
			{memberIsAdmin ? "remove admin" : "make admin"}
		</div>
	);
}

function KickUser(props: any) {
	const [kickMemberMutation] = useMutation(KICK_MEMBER);
	async function kickMember(): Promise<void> {
		try {
			await kickMemberMutation({
				variables: {
					channelId: props.group.id,
					userId: props.member.id,
				},
			});
			await props.refetchChannel();
			alert(props.member.username + "has been kicked from this channel");
			props.setShowModal(false);
		} catch (error) {
			console.error("An error occurred while handling the admin action:", error);
		}
	}
	return (
		<div className="link" onClick={kickMember}>
			kick
		</div>
	);
}

function BanUser(props: any) {
	const memberIsBanned = props.group.banned_users.some(
		(user: any) => user.id === props.member.id
	);

	const [banMemberMutation] = useMutation(BAN_MEMBER);
	const [unbanMemberMutation] = useMutation(UNBAN_MEMBER);

	async function handleBanAction(): Promise<void> {
		const mutation = memberIsBanned ? unbanMemberMutation : banMemberMutation;

		try {
			await mutation({
				variables: {
					channelId: props.group.id,
					userId: props.member.id,
				},
			});
			await props.refetchChannel();
			const alertMsg = memberIsBanned ? " is no longer banned" : " is now banned";
			alert(props.member.username + alertMsg);
			props.setShowModal(false);
		} catch (error) {
			console.error("An error occurred while handling the admin action:", error);
		}
	}
	const linkText = memberIsBanned ? "unban" : "ban";
	return (
		<div className="link ban" onClick={handleBanAction}>
			{linkText}
		</div>
	);
}

const MUTE_TIME_SEC = 60;

function MuteUser(props: any) {
	const [muteMemberMutation] = useMutation(MUTE_MEMBER);
	async function muteMember(): Promise<void> {
		try {
			await muteMemberMutation({
				variables: {
					channelId: props.group.id,
					userId: props.member.id,
					timeout: MUTE_TIME_SEC,
				},
			});
			await props.refetchChannel();

			const now = new Date();
			const time = new Date(now.getTime() + MUTE_TIME_SEC * 1000);
			const timeString = time.toLocaleString("nl-NL", {
				timeZone: "Europe/Amsterdam",
				hour12: false,
			});
			alert(props.member.username + " is now muted until " + timeString);

			props.setShowModal(false);
		} catch (error) {
			console.error("An error occurred while handling the admin action:", error);
		}
	}
	return (
		<div className="link mute" onClick={muteMember}>
			mute
		</div>
	);
}
