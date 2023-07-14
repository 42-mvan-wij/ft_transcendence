import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupChat } from './entities/group_chat.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { CreateGroupChannelInput } from './dto/create_group_chat.input';
import { User } from 'src/user/entities/user.entity';
import { GroupMessage } from '../message/entities/group_message.entity';
import { Not, In } from 'typeorm';
// import * as bcrypt from 'bcrypt';

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

	async getChannelById(id: string): Promise<GroupChat> {
		return this.channelRepository.findOne({ where: { id: id } });
	}

	async create(
		createChannelInput: CreateGroupChannelInput,
	): Promise<GroupChat> {
		const members = await Promise.all(
			createChannelInput.member_ids.map((id) =>
				this.userService.getUserById(id),
			),
		);
		
		let channel = this.channelRepository.create({
			members,
			name: createChannelInput.name,
			logo: createChannelInput.logo,
		});
		if (createChannelInput.password) {
			const bcrypt = require('bcrypt');
			const salt_rounds = 10;

			// TODO: no sleep plz
			const sleep = (ms) => new Promise(r => setTimeout(r, ms));

			await bcrypt.hash(createChannelInput.password, salt_rounds, await function(err, hash) {
				channel.password = hash;
			});
			await sleep(2000);
		}
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
