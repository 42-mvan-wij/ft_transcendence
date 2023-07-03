import { Injectable } from '@nestjs/common';
import { pubSub } from 'src/app.module';
import { QueuedMatch } from './queuedmatch.model';
import { UserService } from 'src/user/user.service';
import { CreateUserInput } from 'src/user/dto/create-user.input';
import { User } from 'src/user/entities/user.entity';
import { UserAvatarService } from 'src/user/user-avatar.service';
import { Avatar } from 'src/user/entities/avatar.entity';
import { v4 as uuid } from 'uuid';
import { QueueAvailability, ChallengeAvailability } from './queuestatus.model';
import { QueueStatus, ChallengeStatus } from './queuestatus.model';

@Injectable()
export class QueueService {
	constructor(
		private readonly userService: UserService,
		private readonly userAvatarService: UserAvatarService,
	) {}
	users_looking_for_match: string[] = [];
	queued_matches: QueuedMatch[] = [];
	current_match: QueuedMatch;
	is_challenger: string[] = []; // TODO: as soon as challenge is sent, the challengers id should be in here so he cannot join queue anymore untill challenge is accepted or denied

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

	private async checkPlayers(id1, id2): Promise<User[]> {
		const p1 = await this.userService.getUserById(id1);
		const p2 = await this.userService.getUserById(id2);
		if (!p1 || !p2) return; // FIXME: deze return value moet gecheckt worden dat dat goed gaat
		return [p1, p2];
	}

	async joinQueue(player_id: string): Promise<string> {
		if (!this.canPlayerLookForMatch(player_id)) {
			return ;
		}

		const queueAvailability: QueueAvailability = new QueueAvailability;
		queueAvailability.queueStatus = QueueStatus.IN_QUEUE;
		pubSub.publish('queueAvailabilityChanged', { queueAvailabilityChanged: queueAvailability, userId: player_id } );
		for (let i = 0; i < this.users_looking_for_match.length; i++) {
			if (this.users_looking_for_match[i] != player_id) {
				this.addQueuedMatch(this.users_looking_for_match[i], player_id);
				this.users_looking_for_match.splice(i, 1);
				return ;
			}
		}
		this.users_looking_for_match.push(player_id);
		return ;
	}

	removeCurrentMatch() {
		this.current_match = null;
	}

	getQueuedMatch(): QueuedMatch | null {
		if (this.queued_matches.length == 0) return;
		this.current_match = this.queued_matches.at(0);
		this.queued_matches.splice(0, 1);
		pubSub.publish('queueChanged', { queueChanged: this.queued_matches });

		const queueAvailability: QueueAvailability = new QueueAvailability;
		queueAvailability.queueStatus = QueueStatus.IN_MATCH;
		pubSub.publish('queueAvailabilityChanged', { queueAvailabilityChanged: queueAvailability, userId: this.current_match.p1.id } );
		pubSub.publish('queueAvailabilityChanged', { queueAvailabilityChanged: queueAvailability, userId: this.current_match.p2.id } );
		return this.current_match;
	}

	getWholeQueue() {
		return this.queued_matches;
	}

	async getQueueAvailability(playerId: string) : Promise<QueueAvailability> {
		const queueAvailability: QueueAvailability = new QueueAvailability;

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
		if (this.current_match?.p1.id === playerId || this.current_match?.p2.id === playerId) {
			queueAvailability.queueStatus = QueueStatus.IN_MATCH
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

	async getChallengeAvailability(playerId: string) : Promise<ChallengeAvailability> {
		const challengeAvailability: ChallengeAvailability = new ChallengeAvailability;

		// TODO: write function that checks if player is online
		if (playerId === "OFFLINE") {
			challengeAvailability.challengeStatus = ChallengeStatus.OFFLINE;
			return challengeAvailability;
		}
		
		const queueAvailability = await this.getQueueAvailability(playerId);
		switch (queueAvailability.queueStatus) {
			case QueueStatus.IN_MATCH:
				challengeAvailability.challengeStatus = ChallengeStatus.IN_MATCH;
				break;
		
			case QueueStatus.IN_QUEUE:
				challengeAvailability.challengeStatus = ChallengeStatus.IN_QUEUE;
				break;
		
			case QueueStatus.IS_CHALLENGER:
				challengeAvailability.challengeStatus = ChallengeStatus.IS_CHALLENGER;
				break;
		
			default:
				challengeAvailability.challengeStatus = ChallengeStatus.CAN_CHALLENGE
				break;
		}
		return challengeAvailability;
	}
	
	async challengeFriend(user_id: string, friend_id: string) {
		const challengeAvailable = await this.getChallengeAvailability(friend_id);
		if (challengeAvailable.challengeStatus != ChallengeStatus.CAN_CHALLENGE) {
			return challengeAvailable;
		}
		this.addQueuedMatch(user_id, friend_id);
		return challengeAvailable;
	}

	canPlayerLookForMatch(playerId: string): Boolean {
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

	/*
	TESTING	
	*/
	putInQueue(id: string): number {
		this.users_looking_for_match.push(id);
		return 3;
	}

	async createMatches() {
		this.createMatch('mweitenb');
		// this.createMatch('jbedaux');

		this.createMatch('Marius');
		this.createMatch('Justin');
		this.createMatch('Milan');
		this.createMatch('Jonathan');
		// this.createMatch('Marius1');
		// this.createMatch('Justin1');
		// this.createMatch('Milan1');
		// this.createMatch('Jonathan1');
		// this.createMatch('Henk1');
		// this.createMatch('Henk2');
		// this.createMatch('Henk3');
		// this.createMatch('Henk4');
		// this.createMatch('Henk5');
		// this.createMatch('Henk6');

		return 4;
	}

	private async createMatch(username: string) {
		const name: string = username;
		const user = await this.userService.getUser(name);
		if (user) await this.joinQueue(user.id);
	}

	async fillDbUser() {
		await this.randomUser('Marius');
		await this.randomUser('Justin');
		await this.randomUser('Milan');
		await this.randomUser('Jonathan');
		await this.randomUser('Marius1');
		await this.randomUser('Justin1');
		await this.randomUser('Milan1');
		await this.randomUser('Jonathan1');
		await this.randomUser('Henk1');
		await this.randomUser('Henk2');
		await this.randomUser('Henk3');
		await this.randomUser('Henk4');
		await this.randomUser('Henk5');
		await this.randomUser('Henk6');
		return 3;
	}

	queuePrint() {
		console.log('\t\t\t USER queue op backend');
		console.log(this.users_looking_for_match);
		console.log('\t\t\t MATCH queue op backend');
		console.log(this.queued_matches);
		return 3;
	}

	async randomUser(name: string) {
		const newUserInput: CreateUserInput = {
			username: name,
			intraId: name + '_intra_id',
		};

		const newUser = await this.userService.create(newUserInput);
		this.changeUserAvatar(newUser);
	}

	async addAvatarToUser(username: string) {
		const user = await this.userService.getUser(username);
		this.changeUserAvatar(user);
		return 3;
	}

	private async changeUserAvatar(user: User) {
		const avatar = new Avatar();
		avatar.parentUserUid = user.id;
		avatar.file = 'd';
		avatar.filename = 'd';
		user.avatar = await this.userAvatarService.createOrUpdate(avatar);
		this.userService.save(user);
	}

	removeQueue() {
		this.queued_matches.splice(0, this.queued_matches.length);
		this.users_looking_for_match.splice(
			0,
			this.users_looking_for_match.length,
		);
		pubSub.publish('queueChanged', { queueChanged: this.queued_matches });
		return 3;
	}
}
