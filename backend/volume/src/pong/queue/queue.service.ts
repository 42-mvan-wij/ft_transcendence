import { Injectable } from '@nestjs/common';
import { pubSub } from 'src/app.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../match/entities/match.entity';
import { User } from '../../user/entities/user.entity';

const DEBUG_PRINT = true;

@Injectable()
export class QueueService {
	constructor(
		@InjectRepository(Match)
		private readonly gameScoreRepo: Repository<Match>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	static match_id: number;
	users_looking_for_match: string[] = [];
	queue_game_score: Match[] = [];

	async createGame(
		player_one_id: string,
		player_two_id: string,
	): Promise<Match> {
		const player_one = await this.userRepo.findOne({
			where: { id: player_one_id },
			// relations: { stats: true },
		});
		const player_two = await this.userRepo.findOne({
			where: { id: player_two_id },
			// relations: { stats: true },
		});

		const new_game = new Match();

		new_game.playerOneScore = 0;
		new_game.playerTwoScore = 0;
		new_game.playerOne = player_one;
		new_game.playerTwo = player_two;

		this.queue_game_score.push(new_game);

		return new_game;
	}

	currentQueue(): Match[] {
		return this.queue_game_score;
	}

	canPlayerLookForMatch(playerId: string): boolean {
		for (let i = 0; i < this.users_looking_for_match.length; i++)
			if (playerId == this.users_looking_for_match[i]) return false;

		// TODO:
		// Voeg check toe waarbij wordt gekeken of player niet al in een match zit
		// of een invite oid heeft verstuurd

		return true;
	}

	async lookForMatch(player_id: string): Promise<Match> | null {
		if (!this.canPlayerLookForMatch(player_id)) return null;

		for (let i = 0; i < this.users_looking_for_match.length; i++) {
			if (this.users_looking_for_match[i] != player_id) {
				const newGame = await this.createGame(
					this.users_looking_for_match[i],
					player_id,
				);
				this.users_looking_for_match.splice(i, 1);

				if (DEBUG_PRINT) {
					console.log('Found game: ', newGame);
					// console.log(newGame.playerOne.stats.losses);
					// console.log(newGame.playerTwo.stats.losses);
				}
				pubSub.publish('gameScoreFound', { MatchFound: newGame });
				return newGame;
			}
		}
		this.users_looking_for_match.push(player_id);
		return null;
	}

	/*
	TESTING	
	*/

	async createMatches() {
		// this.fillDbUserGame();
		await this.lookForMatch('Henk');
		await this.lookForMatch('Henk1');
		await this.lookForMatch('Henk2');
		await this.lookForMatch('Henk3');
		await this.lookForMatch('Henk4');
		await this.lookForMatch('Henk5');
		return 4;
	}

	async fillDbUser() {
	this.randomUser('Henk', 1);
	this.randomUser('Henk1', 2);
	this.randomUser('Henk2', 3);
	this.randomUser('Henk3', 4);
	this.randomUser('Henk4', 5);
	this.randomUser('Henk5', 6);
	return 3;
	}

	queuePrint() {
		console.log('\t\t\t QUEUE op backend');
		console.log(this.users_looking_for_match);
		console.log('\t\t\t GAMESCORE queue');
		console.log(this.queue_game_score);
		return 3;
	}

	async randomUser(name: string, minus: number) {
		const user = await this.userRepo.create();
		user.avatar = name + 'avatar';
		user.username = name;

		user.intraId = name + '_intra_id';
		// user.status = 'online';

		// FIXME: nadat nieuwe opzet data structuur is verwerkt kan dit aangepast worden
		// const user_ranking = await this.rankingRepository.create();
		// user_ranking.losses = 322 - minus;
		// user_ranking.score = 344 - minus;
		// user_ranking.wins = 133 - minus;
		// await this.rankingRepository.save(user_ranking);
		// user.ranking = user_ranking;

		return this.userRepo.save(user);
	}
}
