import { Injectable } from "@nestjs/common";
import { g_online_users } from "./user.service";
import { Args, Mutation } from "@nestjs/graphql";
import { Availability, ChallengeStatus } from "src/pong/queue/queuestatus.model";
import { pubSub } from "src/app.module";
import { QueueService } from "src/pong/queue/queue.service";

const USER_TIME_OUT = 6000;

@Injectable()
export class UserActivityService {
	constructor (private readonly queueService: QueueService ) {
		this.startUserChecking();
	}

	startUserChecking() {
		setInterval(() => this.checkUserTimestamp(), 11000);
	}

	async checkUserTimestamp() {
		for (let i = 0; i < g_online_users.length; i++) {
			if (Date.now() - g_online_users[i][1] > USER_TIME_OUT) {
				const availability: Availability = new Availability;
				availability.challengeStatus = ChallengeStatus.OFFLINE;
				pubSub.publish('challengeAvailabilityChanged', { challengeAvailabilityChanged: availability, userId: g_online_users[i][0] } );
				this.queueService.removeFromQueue(g_online_users[i][0]);
				g_online_users.splice(i, 1);
			}
		}
	}

	// TESTING
	go_offline: any;

	@Mutation(() => Boolean)
	async setUserOnline(@Args('user_id') user_id: string) {
		this.go_offline = setInterval(() => this.userIsOnlineTEST(user_id), 5000);
		return true;
	}

	@Mutation (() => Boolean) 
	async setUserOffline(@Args('user_id') user_id: string) {
		clearInterval(this.go_offline);
		return true;
	}

	async userIsOnlineTEST(userId: string) {
		for (let i in g_online_users) {
			if (g_online_users[i][0] === userId) {
				g_online_users[i][1] = Date.now();
				return true;
			}
		}
		g_online_users.push([ userId, Date.now() ]);
		const availability: Availability = new Availability;
		availability.challengeStatus = ChallengeStatus.ONLINE;
		pubSub.publish('challengeAvailabilityChanged', { challengeAvailabilityChanged: availability, userId: userId } );
		console.log("user is online:", g_online_users[g_online_users.length - 1]);
		return true;
	}
}
