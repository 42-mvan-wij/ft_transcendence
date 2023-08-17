import { createUnionType, Field, ObjectType } from '@nestjs/graphql';
import { GroupMessage } from 'src/chat/group/message/entities/group_message.entity';
import { PersonalMessage } from 'src/chat/personal/message/entities/personal_message.entity';

export const MessageUnion = createUnionType({
	name: 'MessageUnion',
	types: () => [GroupMessage, PersonalMessage] as const,
	resolveType: (value) => {
		if ('isPublic' in value.channel) {
			return GroupMessage;
		}
		return PersonalMessage;
	},
});

export enum MessageType {
	GROUP,
	PERSONAL,
}

@ObjectType()
export class MessageReceivedSubscription {
	@Field()
	type: MessageType;
	@Field(() => MessageUnion)
	message: typeof MessageUnion;
}
