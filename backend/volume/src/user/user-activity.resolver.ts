import { UseGuards } from '@nestjs/common';
import { Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserInfo } from 'src/auth/user-info.interface';
import { UserActivityService } from './user-activity.service';

@Resolver()
export class UserActivityResolver {
	constructor(private userActivityService: UserActivityService) {}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => Boolean)
	async userIsOnline(@AuthUser() user: UserInfo) {
		return this.userActivityService.userIsOnline(user.userUid);
	}
}
