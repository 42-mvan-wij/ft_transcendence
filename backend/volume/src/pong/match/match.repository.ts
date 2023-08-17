import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entities/user.entity';
import { QueueService } from '../queue/queue.service';
import { pubSub } from 'src/app.module';

@Injectable()
export class MatchRepository {
	constructor(
		@InjectRepository(Match)
		private readonly matchRepo: Repository<Match>,
		private readonly userService: UserService,
		private readonly queueService: QueueService,
	) {}

	public async findAll(): Promise<Match[]> {
		return this.matchRepo.find({ relations: ['players'] });
	}

	async getPlayersInMatch(match: Match): Promise<Array<User>> {
		const userMatchHistory = await this.matchRepo.findOne({
			relations: ['players'],
			where: { id: match.id },
		});
		if (userMatchHistory) return userMatchHistory.players;
		return null;
	}

	public async saveMatch(match: Match): Promise<Match> {
		if (!match) throw new Error('No score received');
		const players: User[] = await this.checkPlayers(match.players);
		if (!players || !players[0] || !players[1]) return;
		await this.matchRepo.save(match);
		await this.publishMatchHistory(match, players[0].id);
		await this.publishMatchHistory(match, players[1].id);
		return match;
	}

	private async publishMatchHistory(match: Match, id: string): Promise<void> {
		const user = await this.userService.getUserById(id);
		const matchHistory: Match[] = await this.userService.getMatchHistory(
			user,
		);
		pubSub.publish(`matchHistoryHasBeenUpdated`, {
			matchHistoryHasBeenUpdated: matchHistory,
			user_id: id,
		});
	}

	public removeCurrentMatch() {
		this.queueService.removeCurrentMatch();
	}

	public async initNewMatch(): Promise<Match> {
		const queuedMatch = this.queueService.getQueuedMatch();
		if (!queuedMatch || !queuedMatch.p1 || !queuedMatch.p2) return null;
		const match = new Match();
		match.players = [queuedMatch.p1, queuedMatch.p2];
		match.p1Score = 0;
		match.p2Score = 0;
		match.isFinished = false;
		return match;
	}

	private async checkPlayers(players: User[]): Promise<User[]> {
		const p1 = await this.userService.getUserById(players[0].id);
		const p2 = await this.userService.getUserById(players[1].id);
		return [p1, p2];
	}
}
