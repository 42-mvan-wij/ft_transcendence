import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupChat } from './entities/group_chat.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { CreateGroupChannelInput } from './dto/create_group_chat.input';
import { User } from 'src/user/entities/user.entity';
import { GroupMessage } from '../message/entities/group_message.entity';
import { Not, In } from 'typeorm';

@Injectable()
export class GroupChatService {
	constructor(
		@InjectRepository(GroupChat)
		private readonly channelRepository: Repository<GroupChat>,
		private readonly userService: UserService,
	) {}

	async getAllChannels(): Promise<Array<GroupChat>> {
		return this.channelRepository.find();
	}

	async getAvailablePublicChannels(id: string): Promise<Array<GroupChat>> {
		const user = await this.userService.getUserById(id);
		const userChannels = await this.userService.getGroupChats(user);
		const userChannelIds = userChannels.map((channel) => channel.id);
		const availableChannels = await this.channelRepository.find({
			where: {
				isPublic: true,
				id: Not(In(userChannelIds)),
			},
		});
		return availableChannels;
	}

	async getChannelById(id: string, relations: any = {}): Promise<GroupChat> {
		return this.channelRepository.findOne({ where: { id: id }, relations });
	}

	async create(
		createChannelInput: CreateGroupChannelInput,
		owner_id: string,
	): Promise<GroupChat> {
		const members = await Promise.all(
			createChannelInput.member_ids.map((id) =>
				this.userService.getUserById(id),
			),
		);
		const owner = await this.userService.getUserById(owner_id);
		members.push(owner);

		const channel = this.channelRepository.create({
			members,
			owner,
			admins: [owner],
			name: createChannelInput.name,
			logo: createChannelInput.logo,
		});
		return await this.channelRepository.save(channel);
	}

	async join(userId: string, channelId: string): Promise<GroupChat> {
		const channel = await this.getChannelById(channelId);
		const user = await this.userService.getUserById(userId);

		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		channel.members = await this.getMembers(channel);
		channel.members.push(user);
		return await this.channelRepository.save(channel);
	}

	async promote(channel_id: string, supposed_owner_id: string, user_id: string) {
		const channel = await this.getChannelById(channel_id, {owner: true, members: true, admins: true});
		if (!channel)
			throw new Error(`Channel with id ${channel_id} does not exist`);
		if (channel.owner.id !== supposed_owner_id)
			throw new Error(`User with id ${supposed_owner_id} is not the channel owner`);
		const user = await this.userService.getUserById(user_id);
		if (!user)
			throw new Error(`User with id ${user_id} does not exist`);
		if (channel.members.some((member) => member.id === user_id))
			throw new Error(`User with id ${user_id} is not a member`);
		channel.admins.push(user);
		return await this.channelRepository.save(channel);
	}

	async demote(channel_id: string, supposed_owner_id: string, user_id: string) {
		const channel = await this.getChannelById(channel_id, {owner: true, members: true});
		if (!channel)
			throw new Error(`Channel with id ${channel_id} does not exist`);
		if (channel.owner.id !== supposed_owner_id)
			throw new Error(`User with id ${supposed_owner_id} is not the channel owner`);
		const index = channel.admins.findIndex((admin) => admin.id === user_id)
		if (index < 0)
			throw new Error(`User with id ${user_id} is not an admin`);
		channel.admins.splice(index, 1);
		return await this.channelRepository.save(channel);
	}

	async getMembers(channel: GroupChat): Promise<Array<User>> {
		const channel_with_members = await this.channelRepository.findOne({
			relations: { members: true },
			where: { id: channel.id },
		});
		return channel_with_members.members;
	}

	async getMessages(channel: GroupChat): Promise<Array<GroupMessage>> {
		const channel_with_messages = await this.channelRepository.findOne({
			relations: { messages: true },
			where: { id: channel.id },
		});
		return channel_with_messages.messages;
	}
}
