import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { JwtPartialStrategy } from './strategies/jwt-partial.strategy';

@Module({
	imports: [
		JwtModule.register({
			global: true,
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: '604800s' },
		}),
		PassportModule.register({ defaultStrategy: 'jwt' }),
		forwardRef(() => UserModule),
	],
	controllers: [AuthController],
	providers: [AuthResolver, AuthService, JwtStrategy, JwtPartialStrategy],
})
export class AuthModule {}
