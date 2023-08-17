import { ArgsType, Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MultiBlockStateChange {
	@Field()
	user_id: string;
	@Field()
	blocked: boolean;
}

@ArgsType()
export class MultiBlockStateChangeInput {
	@Field(() => [String])
	user_ids: string[];
}
