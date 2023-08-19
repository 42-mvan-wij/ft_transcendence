import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { TokenType, UserInfo } from './user-info.interface';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators/auth-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { toDataURL } from 'qrcode';
import { JwtPartialGuard } from './guards/jwt-partial.guard';
import { GraphQLContext } from 'src/utils/graphql-context';

@Resolver()
export class AuthResolver {
	constructor(
		private authService: AuthService,
		private readonly userService: UserService,
	) {}

	@UseGuards(JwtAuthGuard)
	@Query(() => String, { nullable: true })
	async QRCodeQuery(@AuthUser() userInfo: UserInfo) {
		const user = await this.userService.getUserById(userInfo.userUid);
		if (user.twoFAEnabled == false) return null;
		const keyuri = await this.authService.getQRCode(
			user.id,
			user.twoFASecret,
		);
		return toDataURL(keyuri);
	}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => String)
	async setTwoFactorMutation(
		@AuthUser() userInfo: UserInfo,
		@Args({ name: 'TwoFAState', type: () => Boolean }) TwoFAState: boolean,
	) {
		const user = await this.userService.getUserById(userInfo.userUid);
		if (TwoFAState == true && user.twoFAEnabled != true) {
			const { secret, otpAuthUrl } =
				await this.authService.generateTwoFASecret(userInfo.userUid);
			await this.userService.setTwoFA(secret, user);
			return true;
		} else if (TwoFAState == true) {
			return true;
		} else {
			await this.userService.unsetTwoFA(user);
			return false;
		}
	}

	@UseGuards(JwtPartialGuard)
	@Mutation(() => Boolean)
	async loginWithTwoFA(
		@Context() context: GraphQLContext,
		@AuthUser() userInfo: UserInfo,
		@Args({ name: 'twoFACode', type: () => String }) twoFACode: string,
	) {
		const isCodeValid = await this.authService.verify2FACode(
			twoFACode,
			userInfo.userUid,
		);
		if (!isCodeValid) return false;
		const jwtCookie = await this.authService.getJwtCookie({
			userUid: userInfo.userUid,
			intraId: userInfo.intraId,
			type: TokenType.FULL,
		});
		context.res.setHeader('Set-Cookie', jwtCookie);
		return true;
	}
}
