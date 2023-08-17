import { Resolver, Subscription, Query, Args } from '@nestjs/graphql';
import { pubSub } from 'src/app.module';
import { Ranking } from './entities/ranking.entity';
import { RankingRepository } from './ranking.repository';
import { getSubscriptionUser } from 'src/utils/getSubscriptionUser';
import { UseGuards } from '@nestjs/common';
import { JwtSubscriptionGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver()
export class RankingResolver {
	constructor(private readonly rankingRepo: RankingRepository) {}

	@Subscription(() => [Ranking])
	rankingHasBeenUpdated() {
		return pubSub.asyncIterator('rankingHasBeenUpdated');
	}

	@Query(() => [Ranking])
	async getRanking() {
		return await this.rankingRepo.findAll();
	}

	@Query(() => Ranking, { nullable: true })
	async getStats(@Args('userId', { type: () => String }) userId: string) {
		return await this.rankingRepo.getRankingByUser(userId);
	}

	@UseGuards(JwtSubscriptionGuard)
	@Subscription(() => Ranking, {
		async filter(payload, variables, context) {
			const user = getSubscriptionUser(context);
			return payload.userId === user.userUid;
		},
	})
	statsHaveBeenUpdated() {
		return pubSub.asyncIterator('statsHaveBeenUpdated');
	}
}
