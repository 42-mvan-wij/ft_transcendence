import {
	Args,
	Mutation,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Avatar } from './entities/avatar.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { UserInfo } from 'src/auth/auth.service';
import { UserAvatarService } from './user-avatar.service';
import { ChangeUserDataInput } from './dto/change-user-data-input';
import { UploadAvatarInput } from './dto/upload-avatar.input';

@Resolver(of => User)
export class UserResolver {
	constructor(
		private userService: UserService,
		private userAvatarService: UserAvatarService
	) {}

	@Query((returns) => [User])
	async allUsersQuery() {
		return this.userService.getAllUsers();
	}

	@Query((returns) => User, { name: 'user'})
	async userQuery(
		@Args('username', { type: () => String }) usernameParam: string,
	) {
		return this.userService.getUser(usernameParam);
	}

	@UseGuards(JwtAuthGuard)
	@Query((returns) => User)
	async currentUserQuery(@AuthUser() user: UserInfo) {
		return this.userService.getUserById(user.userUid);
	}

	@Mutation((returns) => User)
	async createUser(
		@Args('createUserInput') createUserInput: CreateUserInput,
	) {
		return this.userService.create(createUserInput);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(returns => User)
	async changeUserData(
		@AuthUser() userInfo: UserInfo,
		@Args('changeUserData') changeUserData: ChangeUserDataInput
	) {
		const user = await this.userService.getUserById(userInfo.userUid);
		if (changeUserData.avatar) {
			changeUserData.avatar.parentUserUid = userInfo.userUid;
			user.avatar = await this.userAvatarService.createOrUpdate(changeUserData.avatar);
		}
		user.username = changeUserData.username;
		return this.userService.save(user);
	}

	@ResolveField('avatar', returns => Avatar)
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
}
