import {
	Args,
	Mutation,
	Parent,
	Query,
	ResolveField,
	Resolver,
	Subscription,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Avatar } from './entities/avatar.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { UserInfo } from 'src/auth/user-info.interface';
import { UserAvatarService } from './user-avatar.service';
import { ChangeUserDataInput } from './dto/change-user-data-input';
import { pubSub } from 'src/app.module';

@Resolver(() => User)
export class UserResolver {
	constructor(
		private userService: UserService,
		private userAvatarService: UserAvatarService,
	) {}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => Boolean)
	async userIsOnline(@AuthUser() user: UserInfo) {
		return this.userService.userIsOnline(user.userUid);
	}

	@Query(() => [User])
	async allUsersQuery() {
		return this.userService.getAllUsers();
	}

	@Query(() => User)
	async userQuery(@Args('userId', { type: () => String }) userId: string) {
		const user = await this.userService.getUserById(userId);
		if (user) return user;
		return null;
	}

	@UseGuards(JwtAuthGuard)
	@Query(() => User)
	async currentUserQuery(@AuthUser() user: UserInfo) {
		return this.userService.getUserById(user.userUid);
	}

	@Query(() => User)
	async queryUserByName(
		@Args('username', { type: () => String }) username: string,
	) {
		const user = await this.userService.getUser(username);
		if (!user) throw new Error('User not found');
		return user;
	}

	@Mutation(() => User)
	async createUser(
		@Args('createUserInput') createUserInput: CreateUserInput,
	) {
		return this.userService.create(createUserInput);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => User)
	async changeUserData(
		@AuthUser() userInfo: UserInfo,
		@Args('changeUserData') changeUserData: ChangeUserDataInput,
	) {
		const user = await this.userService.getUserById(userInfo.userUid);
		if (changeUserData.avatar) {
			changeUserData.avatar.parentUserUid = userInfo.userUid;
			user.avatar = await this.userAvatarService.createOrUpdate(
				changeUserData.avatar,
			);
		}
		user.username = changeUserData.username;
		await this.userService.save(user);
		return await this.userService.getUserById(userInfo.userUid);
	}

	@ResolveField('avatar', () => Avatar)
	async getAvatar(@Parent() user: User) {
		return this.userAvatarService.getAvatar(user.id);
	}

	@ResolveField()
	async group_chats(@Parent() user: User) {
		return this.userService.getGroupChats(user);
	}

	@ResolveField()
	async personal_chats(@Parent() user: User) {
		return this.userService.getPersonalChats(user);
	}

	@Query(() => [User])
	@UseGuards(JwtAuthGuard)
	async all_available_personal_chats(@AuthUser() userInfo: UserInfo) {
		return this.userService.getAvailablePersonalChats(userInfo.userUid);
	}

	@Query(() => [User])
	async getFriends(@Args('user_id') user_id: string) {
		return this.userService.getFriends(user_id);
	}

	@UseGuards(JwtAuthGuard)
	@Query(() => [User])
	async getIncomingFriendRequest(@AuthUser() userInfo: UserInfo) {
		return this.userService.getIncomingFriendRequest(userInfo.userUid);
	}

	@UseGuards(JwtAuthGuard)
	@Query(() => [User])
	async getOutgoingFriendRequest(@AuthUser() userInfo: UserInfo) {
		return this.userService.getOutgoingFriendRequest(userInfo.userUid);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => Boolean)
	async inviteFriend(
		@AuthUser() userInfo: UserInfo,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.inviteFriend(userInfo.userUid, friend_id);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => User)
	async acceptFriend(
		@AuthUser() userInfo: UserInfo,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.acceptFriend(userInfo.userUid, friend_id);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => Boolean)
	async removeFriend(
		@AuthUser() userInfo: UserInfo,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.removeFriend(userInfo.userUid, friend_id);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => User)
	async denyFriend(
		@AuthUser() userInfo: UserInfo,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.denyFriend(userInfo.userUid, friend_id);
	}

	@Subscription(() => User, {
		filter: async (payload, variables) => {
			return (
				(await variables.user_id) ===
				payload.outgoingFriendRequestChanged.id
			);
		},
	})
	async outgoingFriendRequestChanged(@Args('user_id') user_id: string) {
		return pubSub.asyncIterator('outgoingFriendRequestChanged');
	}

	@Subscription(() => User, {
		filter: async (payload, variables) => {
			return (
				(await variables.user_id) ===
				payload.incomingFriendRequestChanged.id
			);
		},
	})
	async incomingFriendRequestChanged(@Args('user_id') user_id: string) {
		return pubSub.asyncIterator('incomingFriendRequestChanged');
	}

	@Subscription(() => [User], {
		filter: async (payload, variables) => {
			return (await variables.user_id) === payload.id;
		},
	})
	async friendsChanged(@Args('user_id') user_id: string) {
		return pubSub.asyncIterator('friendsChanged');
	}

	// TESTING

	/*
	 	How to create some friends in 3 easy steps:
			1. go to backend/graphql
			2. query { fillDbUser }
			3. query { createFriends (user_name: "your_user_name") }	eg. 'jhille' if you're Justin
	 */
	@Query(() => [User])
	async getIncomingFriendRequest1(@Args('user_id') user_id: string) {
		return this.userService.getIncomingFriendRequest(user_id);
	}

	@Mutation(() => Boolean)
	async inviteFriend1(
		@Args('user_id') user_id: string,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.inviteFriend(user_id, friend_id);
	}

	@Mutation(() => Boolean)
	async acceptFriend1(
		@Args('user_id') user_id: string,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.acceptFriend(user_id, friend_id);
	}

	@Mutation(() => Boolean)
	async removeFriend1(
		@Args('user_id') user_id: string,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.removeFriend(user_id, friend_id);
	}

	@Query(() => [User])
	async getFriends1(@Args('user_id') user_id: string) {
		return this.userService.getFriends(user_id);
	}

	@Mutation(() => User)
	async denyFriend1(
		@Args('user_id') user_id: string,
		@Args('friend_id') friend_id: string,
	) {
		return this.userService.denyFriend(user_id, friend_id);
	}

	@Query(() => Number)
	createFriends(@Args('user_name') user_name: string) {
		return this.userService.createFriends(user_name);
	}

	@Mutation(() => Number)
	inviteFromMultiFriends(@Args('username') username: string) {
		return this.userService.inviteFromMultiFriends(username);
	}

	@Mutation(() => Number)
	inviteToMultiFriends(@Args('username') username: string) {
		return this.userService.inviteToMultiFriends(username);
	}
}
