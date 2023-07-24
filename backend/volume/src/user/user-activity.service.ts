import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Args, Mutation } from "@nestjs/graphql";
import { Availability, ChallengeStatus } from "src/pong/queue/queuestatus.model";
import { pubSub } from "src/app.module";
import { QueueService } from "src/pong/queue/queue.service";

const USER_TIME_OUT = 8100;

@Injectable()
export class UserActivityService {
	constructor (
		@Inject(forwardRef(() => QueueService))
		private readonly queueService: QueueService 
	) 
	{
		this.startUserChecking();
	}

	startUserChecking() {
		setInterval(() => this.checkUserTimestamp(), 11000);
	}

	online_users: [ string, number ][] = [];

	async userIsOnline(userId: string) {
		for (let i in this.online_users) {
			if (this.online_users[i][0] === userId) {
				this.online_users[i][1] = Date.now();
				return true;
			}
		}
		this.online_users.push([ userId, Date.now() ]);
		const availability: Availability = new Availability;
		availability.challengeStatus = ChallengeStatus.ONLINE;
		pubSub.publish('challengeAvailabilityChanged', { challengeAvailabilityChanged: availability, userId: userId } );
		return true;
	}

	async checkUserTimestamp() {
		for (let i = 0; i < this.online_users.length; i++) {
			if (Date.now() - this.online_users[i][1] > USER_TIME_OUT) {
				const availability: Availability = new Availability;
				availability.challengeStatus = ChallengeStatus.OFFLINE;
				pubSub.publish('challengeAvailabilityChanged', { challengeAvailabilityChanged: availability, userId: this.online_users[i][0] } );
				this.queueService.removeFromQueueOrMatch(this.online_users[i][0]);
				this.online_users.splice(i, 1);
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
		for (let i in this.online_users) {
			if (this.online_users[i][0] === userId) {
				this.online_users[i][1] = Date.now();
				return true;
			}
		}
		this.online_users.push([ userId, Date.now() ]);
		const availability: Availability = new Availability;
		availability.challengeStatus = ChallengeStatus.ONLINE;
		pubSub.publish('challengeAvailabilityChanged', { challengeAvailabilityChanged: availability, userId: userId } );
		console.log("user is online:", this.online_users[this.online_users.length - 1]);
		return true;
	}
}
