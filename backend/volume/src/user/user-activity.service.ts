import { Injectable } from "@nestjs/common";
import { g_online_users } from "./user.service";

const USER_TIME_OUT = 6000;

@Injectable()
export class UserActivityService {
	constructor () {
		this.startUserChecking();
	}

	startUserChecking() {
		setInterval(() => this.checkUserTimestamp(), 11000);
	}

	async checkUserTimestamp() {
		for (let i = 0; i < g_online_users.length; i++) {
			if (Date.now() - g_online_users[i][1] > USER_TIME_OUT) {
				console.log("user gone offline:", g_online_users[i]);
				g_online_users.splice(i, 1);
			}
		}
	}
}
