import { Injectable } from '@nestjs/common';
import * as i from './pongLogic/interfaces';
import * as C from './pongLogic/constants';
import { Match } from './match/entities/match.entity';
import { MatchRepository } from './match/Match.repository';
import { GameScoreDto } from './match/dto/match.dto';
import { QueueService } from './queue/queue.service';

@Injectable()
export class PongService {
	constructor(private readonly matchRepository: MatchRepository, private queueService: QueueService) {}

	public async saveMatch(score: i.GameScore): Promise<Match> {
		if (!score) throw new Error('No score received');
		const scoreEntity = new Match();
		scoreEntity.players = [score.playerOne, score.playerTwo];
		scoreEntity.playerOneScore = score.score.playerOne;
		scoreEntity.playerTwoScore = score.score.playerTwo;
	  
		return this.matchRepository.saveMatch(scoreEntity);
	}

	enlargePaddle(canvas: i.Canvas, state: i.GameState): void {
		if (state.paddleRight.height < canvas.height) {
			state.paddleRight.height *= 1.2;
		}
	}

	reducePaddle(canvas: i.Canvas, state: i.GameState): void {
		if (state.paddleRight.height > canvas.paddleHeight) {
			state.paddleRight.height *= 0.8;
		}
	}

	handleMouseYUpdate(mouseY: number, state: i.GameState): void {
		state.paddleRight.y = mouseY;
	}

	handleMouseClick(mouseClick: boolean, state: i.GameState): void {
		if (mouseClick && !state.started) {
			this.startGame(state);
		}
	}

	private startGame(state: i.GameState): void {
		state.started = true;
		console.log('Ball is in play');

		if (state.serveLeft.state) state.ball.xSpeed = C.BALL_SPEED;
		if (state.serveRight.state) state.ball.xSpeed = -C.BALL_SPEED;
		state.serveRight.state = false;
	}

	initCanvas(): i.Canvas {
		const width = 2;
		const height = width / 2;
		const paddleHeight = height / 5;
		const paddleWidth = paddleHeight / 10;
		const borderOffset = paddleWidth / 2;
		const ballDiameter = paddleWidth * 2;
		const canvas: i.Canvas = {
			height,
			width,
			paddleHeight,
			paddleWidth,
			ballDiameter,
			borderOffset,
		};
		return canvas;
	}
	
	async getNewGameScore(): Promise<i.GameScore> {
		this.queueService.createMatches();
		const queuedMatch = this.queueService.getQueuedMatch();
		// console.log(this.queueService.getWholeQueue());
		console.log(queuedMatch);
		if (!queuedMatch) return;
		// if (!queuedMatch) throw new Error('No queued match found');
		const gameScore: i.GameScore = {
			id: 0,
			playerOne: queuedMatch.playerOne,
			playerTwo: queuedMatch.playerTwo,
			score: {
				playerOne: 0,
				playerTwo: 0,
			},
		};
		// console.log(gameScore);
		return gameScore;
	}

	async initializeGameState(canvas: i.Canvas): Promise<i.GameState> {
		const paddleLeft: i.Paddle = {
			x: canvas.borderOffset,
			y: canvas.height / 2,
			height: canvas.paddleHeight,
		};
	
		const paddleRight: i.Paddle = {
			x: canvas.width - canvas.borderOffset - canvas.paddleWidth,
			y: canvas.height / 2,
			height: canvas.paddleHeight,
		};
	
		const serveLeft: i.ServeState = {
			state: false,
			x: paddleLeft.x + canvas.paddleWidth + canvas.ballDiameter / 2,
			y: paddleLeft.y + 0.5 * canvas.paddleHeight,
		};
	
		const serveRight: i.ServeState = {
			state: true,
			x: paddleRight.x - canvas.ballDiameter / 2,
			y: paddleRight.y + 0.5 * canvas.paddleHeight,
		};
	
		const ball: i.Ball = {
			x: serveRight.x,
			y: paddleRight.y + canvas.paddleHeight / 2,
			xSpeed: -C.BALL_SPEED,
			ySpeed: C.BALL_SPEED,
		};
	
		const state: i.GameState = {
			started: false,
			paddleLeft,
			paddleRight,
			serveLeft,
			serveRight,
			ball,
			gameScore: await this.getNewGameScore(),
		};
	
		return state;
	}	
}
