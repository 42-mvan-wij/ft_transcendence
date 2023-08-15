import {
	Args,
	Mutation,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { GroupChat } from './entities/group_chat.entity';
import { CreateGroupChannelInput } from './dto/create_group_chat.input';
import { GroupChatService } from './group_chat.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { UserInfo } from 'src/auth/user-info.interface';

@Resolver(() => GroupChat)
export class GroupChatResolver {
	constructor(private readonly group_chat_service: GroupChatService) {}

	@Query(() => [GroupChat])
	async all_group_chats() {
		return this.group_chat_service.getAllChannels();
	}

	@Query(() => [GroupChat])
	@UseGuards(JwtAuthGuard)
	async all_available_public_channels(@AuthUser() userInfo: UserInfo) {
		return this.group_chat_service.getAvailablePublicChannels(
			userInfo.userUid,
		);
	}

	@Query(() => [GroupChat])
	@UseGuards(JwtAuthGuard)
	async all_available_private_channels(@AuthUser() userInfo: UserInfo) {
		return this.group_chat_service.getAvailablePrivateChannels(
			userInfo.userUid,
		);
	}

	@Query(() => GroupChat) // TODO: add guards, to check if the user is a member of the channel, else disallow (also do this in other places)
	async group_chat(@Args('id') id: string) {
		return this.group_chat_service.getChannelById(id);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat, { nullable: true })
	async createGroupChat(
		@AuthUser() user: UserInfo,
		@Args() channel_input: CreateGroupChannelInput,
	) {
		return this.group_chat_service.create(channel_input, user.userUid);
	}

	@Mutation(() => GroupChat, { nullable: true })
	@UseGuards(JwtAuthGuard)
	async joinGroupChat(
		@AuthUser() userInfo: UserInfo,
		@Args('channelId') channelId: string,
	) {
		return this.group_chat_service.join(userInfo.userUid, channelId);
	}

	@Mutation(() => Boolean, { nullable: true })
	@UseGuards(JwtAuthGuard)
	async joinPrivateGroupChat(
		@AuthUser() userInfo: UserInfo,
		@Args('channelId') channelId: string,
		@Args('password') password: string,
	) {
		return this.group_chat_service.joinPrivate(
			userInfo.userUid,
			channelId,
			password,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async promote(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
		@Args('user_id') user_id: string,
	) {
		return await this.group_chat_service.promote(
			channel_id,
			user.userUid,
			user_id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async demote(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
		@Args('user_id') user_id: string,
	) {
		return await this.group_chat_service.demote(
			channel_id,
			user.userUid,
			user_id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async mute(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
		@Args('user_id') user_id: string,
		@Args('timeout') timeout: number,
	) {
		return await this.group_chat_service.mute(
			channel_id,
			user.userUid,
			user_id,
			timeout,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async kick(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
		@Args('user_id') user_id: string,
	) {
		return await this.group_chat_service.kick(
			channel_id,
			user.userUid,
			user_id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async ban(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
		@Args('user_id') user_id: string,
	) {
		return await this.group_chat_service.ban(
			channel_id,
			user.userUid,
			user_id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async unban(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
		@Args('user_id') user_id: string,
	) {
		return await this.group_chat_service.unban(
			channel_id,
			user.userUid,
			user_id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupChat)
	async leaveGroupChat(
		@AuthUser() user: UserInfo,
		@Args('channel_id') channel_id: string,
	) {
		return await this.group_chat_service.leaveGroupChat(
			channel_id,
			user.userUid,
		);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => Boolean)
	async changePassword(@AuthUser() user: UserInfo, @Args('channel_id') channel_id: string, @Args('old_password') old_password: string, @Args('new_password') new_password: string) {
		return this.group_chat_service.changePassword(user.userUid, channel_id, old_password, new_password);	
	}

	@ResolveField()
	async members(@Parent() channel: GroupChat) {
		return this.group_chat_service.getMembers(channel);
	}

	@ResolveField()
	async owner(@Parent() channel: GroupChat) {
		return this.group_chat_service.getOwner(channel);
	}

	@ResolveField()
	async admins(@Parent() channel: GroupChat) {
		return this.group_chat_service.getAdmins(channel);
	}

	@ResolveField()
	async muted_members(@Parent() channel: GroupChat) {
		return this.group_chat_service.getMutedMembers(channel);
	}

	@ResolveField()
	async banned_users(@Parent() channel: GroupChat) {
		return this.group_chat_service.getBannedUsers(channel);
	}

	@ResolveField()
	async messages(@Parent() channel: GroupChat) {
		return this.group_chat_service.getMessages(channel);
	}

	@ResolveField()
	async lastMessage(@Parent() channel: GroupChat) {
		// NOTE: maybe there is a better way to do this
		const messages = channel.messages ?? (await this.messages(channel));
		if (messages.length > 0) return messages[messages.length - 1];
		return null;
	}
}
