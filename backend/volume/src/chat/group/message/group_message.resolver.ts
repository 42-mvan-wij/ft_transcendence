import {
	Args,
	Mutation,
	Parent,
	ResolveField,
	Resolver,
	Subscription,
} from '@nestjs/graphql';
import { GroupMessage } from './entities/group_message.entity';
import { CreateGroupMessageInput } from './dto/create_group_message.input';
import { GroupMessageService } from './group_message.service';
import { pubSub } from 'src/app.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { UserInfo } from 'src/auth/user-info.interface';
import { GroupChatService } from '../chat/group_chat.service';
import { MessageType } from 'src/user/dto/message-received-subscrption.dto';

@Resolver(() => GroupMessage)
export class GroupMessageResolver {
	constructor(
		private readonly group_message_service: GroupMessageService,
		private readonly group_chat_service: GroupChatService,
	) {}

	@UseGuards(JwtAuthGuard)
	@Mutation(() => GroupMessage, { nullable: true })
	async createGroupMessage(
		@Args() message_input: CreateGroupMessageInput,
		@AuthUser() user_info: UserInfo,
	) {
		if (await this.group_chat_service.isNotAMemberOfChannel(user_info.userUid, message_input.channel_id)) {
			return null;
		}
		const message = await this.group_message_service.create(
			message_input,
			user_info.userUid,
		);
		pubSub.publish('group_message_sent', { group_message_sent: message });
		this.group_chat_service.getMembers(message.channel).then((members) => {
			for (const member of members) {
				pubSub.publish('message_received', {
					message_received: { type: MessageType.GROUP, message },
					user_id: member.id,
				});
			}
		});
		return message;
	}

	@Subscription(() => GroupMessage, {
		filter: async (payload, variables) => {
			if (variables.channel_id === null) return true;
			return (
				(await payload.group_message_sent).channel.id ===
				variables.channel_id
			);
		},
	})
	async group_message_sent(
		@Args('channel_id', { nullable: true }) channel_id: string,
	) {
		return pubSub.asyncIterator('group_message_sent');
	}

	@ResolveField()
	async channel(@Parent() message: GroupMessage) {
		return this.group_message_service.getChannel(message);
	}

	@ResolveField()
	async author(@Parent() message: GroupMessage) {
		return this.group_message_service.getAuthor(message);
	}
}
