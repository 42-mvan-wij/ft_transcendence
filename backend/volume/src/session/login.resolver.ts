import { Query, Resolver } from '@nestjs/graphql';
import { LoginService } from './login.service';
import { Login } from './login.model';

@Resolver((of) => Login)
export class LoginResolver {
	constructor(private loginService: LoginService) {}

	@Query((returns) => String)
	async clientUidQuery() {
		return this.loginService.getClientUid();
	}
}
