import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { pubSub } from 'src/app.module';
import { QueuedMatch } from './queuedmatch.model';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { UserAvatarService } from 'src/user/user-avatar.service';
import { Availability } from './queuestatus.model';
import { QueueStatus, ChallengeStatus } from './queuestatus.model';
import { Challenge } from './challenge.model';
import { v4 as uuid } from 'uuid';
import { UserActivityService } from 'src/user/user-activity.service';
import { PongService } from '../pong.service';

@Injectable()
export class QueueService {
	constructor(
		private readonly userService: UserService,
		private readonly userAvatarService: UserAvatarService,
		@Inject(forwardRef(() => UserActivityService))
		private readonly userActivityService: UserActivityService,
		@Inject(forwardRef(() => PongService))
		private readonly pongService: PongService,
	) {}
	users_looking_for_match: string[] = [];
	queued_matches: QueuedMatch[] = [];
	current_match: QueuedMatch;
	is_challenger: string[] = [];
	challenges: Challenge[] = [];

	async getStatus(user_id: string) {
		const availability: Availability = new Availability();

		availability.challengeStatus = ChallengeStatus.OFFLINE;
		for (const i in this.userActivityService.online_users) {
			if (this.userActivityService.online_users[i][0] === user_id) {
				availability.challengeStatus = ChallengeStatus.ONLINE;
			}
		}
		for (const i in this.queued_matches) {
			if (
				user_id === this.queued_matches[i].p1.id ||
				user_id === this.queued_matches[i].p2.id ||
				user_id === this.users_looking_for_match[0]
			) {
				availability.challengeStatus = ChallengeStatus.IN_QUEUE;
				return availability;
			}
		}
		if (
			user_id === this.current_match.p1.id ||
			user_id === this.current_match.p2.id
		) {
			availability.challengeStatus = ChallengeStatus.IN_MATCH;
		}
		return availability;
	}

	async addQueuedMatch(
		player_one_id: string,
		player_two_id: string,
	): Promise<QueuedMatch> {
		const players: User[] = await this.checkPlayers(
			player_one_id,
			player_two_id,
		);
		const new_queued_match = new QueuedMatch();
		new_queued_match.id = uuid();
		new_queued_match.p1 = players[0];
		new_queued_match.p2 = players[1];
		this.queued_matches.push(new_queued_match);
		pubSub.publish('queueChanged', { queueChanged: this.queued_matches });
		return new_queued_match;
	}

	async addChallengeMatch(
		user_id: string,
		challenger_id: string,
	): Promise<QueuedMatch> {
		const players: User[] = await this.checkPlayers(user_id, challenger_id);
		const new_queued_match = new QueuedMatch();
		new_queued_match.id = uuid();
		new_queued_match.p1 = players[0];
		new_queued_match.p2 = players[1];
		const availability: Availability = new Availability();
		availability.queueStatus = QueueStatus.IN_QUEUE;
		availability.challengeStatus = ChallengeStatus.IN_QUEUE;
		pubSub.publish('queueAvailabilityChanged', {
			queueAvailabilityChanged: availability,
			userId: user_id,
		});
		pubSub.publish('queueAvailabilityChanged', {
			queueAvailabilityChanged: availability,
			userId: challenger_id,
		});
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: availability,
			userId: challenger_id,
		});
		pubSub.publish('challengeAvailabilityChanged', {
			challengeAvailabilityChanged: availability,
			userId: user_id,
		});

		this.queued_matches.push(new_queued_match);
		pubSub.publish('queueChanged', { queueChanged: this.queued_matches });
		return new_queued_match;
	}

	private async checkPlayers(id1, id2): Promise<User[]> {
		const p1 = await this.userService.getUserById(id1);
		const p2 = await this.userService.getUserById(id2);
		if (!p1 || !p2) return;
		return [p1, p2];
	}

	async joinQueue(player_id: string): Promise<string> {
		if (!this.canPlayerLookForMatch(player_id)) {
			return;
		}

		const availability: Availability = new Availability();
		availability.queueStatus = QueueStatus.IN_QUEUE;
		availability.challengeStatus = ChallengeStatus.IN_QUEUE;
		pubSub.publish('queueAvailabilityChanged', {
			queueAvailabilityChanged: availability,
			userId: player_id,
		});
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: availability,
			userId: player_id,
		});
		pubSub.publish('challengeAvailabilityChanged', {
			challengeAvailabilityChanged: availability,
			userId: player_id,
		});
		for (let i = 0; i < this.users_looking_for_match.length; i++) {
			if (this.users_looking_for_match[i] != player_id) {
				this.addQueuedMatch(this.users_looking_for_match[i], player_id);
				this.users_looking_for_match.splice(i, 1);
				return;
			}
		}
		this.users_looking_for_match.push(player_id);
		return;
	}

	removeCurrentMatch() {
		this.current_match = null;
	}

	removeFromQueueOrMatch(offline_user_id: string) {
		for (let i = 0; i < this.users_looking_for_match.length; i++) {
			if (offline_user_id === this.users_looking_for_match[i]) {
				this.users_looking_for_match.splice(i, 1);
				return;
			}
		}
		for (let i = 0; i < this.queued_matches.length; i++) {
			if (
				offline_user_id === this.queued_matches[i].p1.id ||
				offline_user_id === this.queued_matches[i].p2.id
			) {
				let opponent_id: string;
				if (offline_user_id === this.queued_matches[i].p1.id) {
					opponent_id = this.queued_matches[i].p2.id;
				} else {
					opponent_id = this.queued_matches[i].p1.id;
				}
				const queueAvailability: Availability = new Availability();
				queueAvailability.queueStatus = QueueStatus.CAN_JOIN;
				pubSub.publish('queueAvailabilityChanged', {
					queueAvailabilityChanged: queueAvailability,
					userId: this.queued_matches[i].p1.id,
				});
				pubSub.publish('queueAvailabilityChanged', {
					queueAvailabilityChanged: queueAvailability,
					userId: this.queued_matches[i].p2.id,
				});
				pubSub.publish('removedFromQueue', {
					removedFromQueue: this.queued_matches[i].id,
					userId: opponent_id,
				});
				this.queued_matches.splice(i, 1);
				pubSub.publish('queueChanged', {
					queueChanged: this.queued_matches,
				});
				return;
			}
		}
		if (
			offline_user_id === this.current_match?.p1.id ||
			offline_user_id === this.current_match?.p2.id
		) {
			this.pongService.removeMatch(offline_user_id);

			const queueAvailability: Availability = new Availability();
			queueAvailability.queueStatus = QueueStatus.CAN_JOIN;
			pubSub.publish('queueAvailabilityChanged', {
				queueAvailabilityChanged: queueAvailability,
				userId: this.current_match.p1.id,
			});
			pubSub.publish('queueAvailabilityChanged', {
				queueAvailabilityChanged: queueAvailability,
				userId: this.current_match.p2.id,
			});
		}
	}

	getQueuedMatch(): QueuedMatch | null {
		if (this.queued_matches.length == 0) return;
		this.current_match = this.queued_matches.at(0);
		this.queued_matches.splice(0, 1);
		pubSub.publish('queueChanged', { queueChanged: this.queued_matches });

		const queueAvailability: Availability = new Availability();
		queueAvailability.queueStatus = QueueStatus.IN_MATCH;
		pubSub.publish('queueAvailabilityChanged', {
			queueAvailabilityChanged: queueAvailability,
			userId: this.current_match.p1.id,
		});
		pubSub.publish('queueAvailabilityChanged', {
			queueAvailabilityChanged: queueAvailability,
			userId: this.current_match.p2.id,
		});

		const challengeAvailability: Availability = new Availability();
		challengeAvailability.challengeStatus = ChallengeStatus.IN_MATCH;
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: challengeAvailability,
			userId: this.current_match.p1.id,
		});
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: challengeAvailability,
			userId: this.current_match.p2.id,
		});
		pubSub.publish('challengeAvailabilityChanged', {
			challengeAvailabilityChanged: challengeAvailability,
			userId: this.current_match.p2.id,
		});
		pubSub.publish('challengeAvailabilityChanged', {
			challengeAvailabilityChanged: challengeAvailability,
			userId: this.current_match.p1.id,
		});
		return this.current_match;
	}

	getWholeQueue() {
		return this.queued_matches;
	}

	async getQueueAvailability(playerId: string): Promise<Availability> {
		const queueAvailability: Availability = new Availability();

		queueAvailability.queueStatus = QueueStatus.CAN_JOIN;
		for (let i = 0; i < this.is_challenger.length; i++) {
			if (playerId === this.is_challenger[i]) {
				queueAvailability.queueStatus = QueueStatus.IS_CHALLENGER;
				return queueAvailability;
			}
		}
		for (let i = 0; i < this.users_looking_for_match.length; i++) {
			if (playerId === this.users_looking_for_match[i]) {
				queueAvailability.queueStatus = QueueStatus.IN_QUEUE;
				return queueAvailability;
			}
		}
		if (
			this.current_match?.p1.id === playerId ||
			this.current_match?.p2.id === playerId
		) {
			queueAvailability.queueStatus = QueueStatus.IN_MATCH;
			return queueAvailability;
		}
		for (let i = 0; i < this.queued_matches.length; i++) {
			if (
				playerId === this.queued_matches[i].p1.id ||
				playerId === this.queued_matches[i].p2.id
			) {
				queueAvailability.queueStatus = QueueStatus.IN_QUEUE;
				return queueAvailability;
			}
		}
		return queueAvailability;
	}

	async getChallengeAvailability(playerId: string): Promise<Availability> {
		const challengeAvailability: Availability = new Availability();
		const queueAvailability = await this.getQueueAvailability(playerId);
		let online: boolean;

		for (const i in this.userActivityService.online_users) {
			if (playerId === this.userActivityService.online_users[i][0]) {
				online = true;
				break;
			}
		}
		if (!online) {
			challengeAvailability.challengeStatus = ChallengeStatus.OFFLINE;
			return challengeAvailability;
		}
		switch (await queueAvailability.queueStatus) {
			case QueueStatus.IN_MATCH:
				challengeAvailability.challengeStatus =
					ChallengeStatus.IN_MATCH;
				break;
			case QueueStatus.IN_QUEUE:
				challengeAvailability.challengeStatus =
					ChallengeStatus.IN_QUEUE;
				break;
			case QueueStatus.IS_CHALLENGER:
				challengeAvailability.challengeStatus =
					ChallengeStatus.IS_CHALLENGER;
				break;
			default:
				challengeAvailability.challengeStatus = ChallengeStatus.ONLINE;
				break;
		}
		return challengeAvailability;
	}

	async getIncomingChallenge(user_id: string): Promise<User> | null {
		for (let i = 0; i < this.challenges.length; i++) {
			if (this.challenges[i].opponent_id === user_id) {
				const challenger: User = await this.userService.getUserById(
					this.challenges[i].challenger_id,
				);
				return challenger;
			}
		}
		return null;
	}

	async challengeFriend(challenger_id: string, friend_id: string) {
		let challengeAvailable = await this.getChallengeAvailability(friend_id);
		if (challengeAvailable.challengeStatus != ChallengeStatus.ONLINE) {
			return false;
		}
		challengeAvailable = await this.getChallengeAvailability(challenger_id);
		if (challengeAvailable.challengeStatus != ChallengeStatus.ONLINE) {
			return false;
		}
		this.is_challenger.push(challenger_id);
		challengeAvailable = await this.getChallengeAvailability(challenger_id);
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: challengeAvailable,
			userId: challenger_id,
		});
		const challenger: User = await this.userService.getUserById(
			challenger_id,
		);
		pubSub.publish('incomingChallenge', {
			incomingChallenge: challenger,
			userId: friend_id,
		});
		this.timeoutAutoDenyChallenge(challenger_id, friend_id);
		return true;
	}

	sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async timeoutAutoDenyChallenge(challenger_id: string, friend_id: string) {
		await this.sleep(11000);

		for (let i = 0; i < this.is_challenger.length; i++) {
			if (challenger_id === this.is_challenger[i]) {
				this.is_challenger.splice(i, 1);
			}
		}
		const challengeAvailable = await this.getChallengeAvailability(
			challenger_id,
		);
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: challengeAvailable,
			userId: challenger_id,
		});
		pubSub.publish('incomingChallenge', {
			incomingChallenge: null,
			userId: friend_id,
		});
	}

	canPlayerLookForMatch(playerId: string): boolean {
		for (let i = 0; i < this.users_looking_for_match.length; i++) {
			if (playerId === this.users_looking_for_match[i]) {
				return false;
			}
		}
		if (
			this.current_match &&
			(this.current_match.p1.id === playerId ||
				this.current_match.p2.id === playerId)
		) {
			return false;
		}
		for (let i = 0; i < this.queued_matches.length; i++) {
			if (
				playerId === this.queued_matches[i].p1.id ||
				playerId === this.queued_matches[i].p2.id
			) {
				return false;
			}
		}
		return true;
	}

	async acceptChallenge(user_id: string, challenger_id: string) {
		this.addChallengeMatch(user_id, challenger_id);
		for (let i = 0; i < this.is_challenger.length; i++) {
			if (challenger_id === this.is_challenger[i]) {
				this.is_challenger.splice(i, 1);
			}
		}

		const challengeAvailable = await this.getChallengeAvailability(user_id);
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: challengeAvailable,
			userId: challenger_id,
		});
		pubSub.publish('incomingChallenge', {
			incomingChallenge: null,
			userId: user_id,
		});
		return true;
	}

	async denyChallenge(user_id: string, friend_id: string) {
		for (let i = 0; i < this.is_challenger.length; i++) {
			if (friend_id === this.is_challenger[i]) {
				this.is_challenger.splice(i, 1);
			}
		}
		const challengeAvailable = await this.getChallengeAvailability(user_id);
		pubSub.publish('ownChallengeAvailabilityChanged', {
			ownChallengeAvailabilityChanged: challengeAvailable,
			userId: friend_id,
		});
		pubSub.publish('incomingChallenge', {
			incomingChallenge: null,
			userId: user_id,
		});
		return true;
	}
}
