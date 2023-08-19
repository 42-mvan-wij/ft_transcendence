import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
	Availability,
	ChallengeStatus,
} from 'src/pong/queue/queuestatus.model';
import { pubSub } from 'src/app.module';
import { QueueService } from 'src/pong/queue/queue.service';

const USER_TIME_OUT = 9100;

@Injectable()
export class UserActivityService {
	constructor(
		@Inject(forwardRef(() => QueueService))
		private readonly queueService: QueueService,
	) {
		this.startUserChecking();
	}

	startUserChecking() {
		setInterval(() => this.checkUserTimestamp(), 11000);
	}

	online_users: [string, number, number][] = [];

	async userIsOnline(userId: string) {
		for (const i in this.online_users) {
			if (this.online_users[i][0] === userId) {
				this.online_users[i][2]++;
				if (this.online_users[i][2] > 2) {
					this.online_users[i][1] = Date.now();
					this.online_users[i][2] = 0;
				}
				return true;
			}
		}
		this.online_users.push([userId, Date.now(), 0]);
		const availability: Availability = new Availability();
		availability.challengeStatus = ChallengeStatus.ONLINE;
		pubSub.publish('challengeAvailabilityChanged', {
			challengeAvailabilityChanged: availability,
			userId: userId,
		});
		return true;
	}

	async checkUserTimestamp() {
		for (let i = 0; i < this.online_users.length; i++) {
			if (Date.now() - this.online_users[i][1] > USER_TIME_OUT) {
				const availability: Availability = new Availability();
				availability.challengeStatus = ChallengeStatus.OFFLINE;
				pubSub.publish('challengeAvailabilityChanged', {
					challengeAvailabilityChanged: availability,
					userId: this.online_users[i][0],
				});
				this.queueService.removeFromQueueOrMatch(
					this.online_users[i][0],
				);
				this.online_users.splice(i, 1);
			}
		}
	}
}
