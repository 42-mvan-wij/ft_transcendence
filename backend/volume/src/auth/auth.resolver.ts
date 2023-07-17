import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, GqlExecutionContext, Args } from '@nestjs/graphql';
import { UserInfo } from './user-info.interface';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators/auth-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
const QRCode = require('qrcode');

@Resolver()
export class AuthResolver {
	constructor(
		private authService: AuthService,
		private readonly userService: UserService,
	) {}

	// @Query()
	// async QRCodeQuery() {
	//
	// }

	@UseGuards(JwtAuthGuard)
	@Mutation(() => String)
	async setTwoFactorMutation(
		@AuthUser() userInfo: UserInfo,
		@Args({name: 'TwoFAState', type: () => Boolean}) TwoFAState: boolean
	) {
		const user = await this.userService.getUserById(userInfo.userUid);
		if (user.twoFAEnabled == false) {
			const { secret, otpAuthUrl } = await this.authService.generateTwoFASecret(userInfo.userUid);
			await this.userService.setTwoFA(secret, user);
			return QRCode.toDataURL(otpAuthUrl);
		}
		return null;
	}

	@UseGuards(JwtAuthGuard)
	@Mutation()
	async disableTwoFactorMutation(@AuthUser() userInfo: UserInfo) {	
		const user = await this.userService.getUserById(userInfo.userUid);
		if (user.twoFAEnabled == true) {
			this.userService.unsetTwoFA(user);
		}
	}
}
