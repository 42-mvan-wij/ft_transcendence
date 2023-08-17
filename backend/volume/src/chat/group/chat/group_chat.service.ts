import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupChat } from './entities/group_chat.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { CreateGroupChannelInput } from './dto/create_group_chat.input';
import { User } from 'src/user/entities/user.entity';
import { GroupMessage } from '../message/entities/group_message.entity';
import { Not, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { pubSub } from 'src/app.module';

const mute_table: { [_: string]: [string, NodeJS.Timeout][] } = {};

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

	async getAvailablePrivateChannels(id: string): Promise<Array<GroupChat>> {
		const user = await this.userService.getUserById(id);
		const userChannels = await this.userService.getGroupChats(user);
		const userChannelIds = userChannels.map((channel) => channel.id);
		const availableChannels = await this.channelRepository.find({
			where: {
				isPublic: false,
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
		if (createChannelInput.password) {
			const salt_rounds = 10;
			const promise = new Promise<string>((resolve, reject) => {
				bcrypt.hash(
					createChannelInput.password,
					salt_rounds,
					function (err, hash) {
						if (err) reject(err);
						resolve(hash);
					},
				);
			});
			channel.isPublic = false;
			channel.password = await promise;
		}
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelCreated', { channelCreated: savedChannel });
		return savedChannel;
	}

	async join(userId: string, channelId: string): Promise<GroupChat> {
		const channel = await this.getChannelById(channelId, {
			banned_users: true,
			members: true,
		});
		const user = await this.userService.getUserById(userId);

		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		if (!user) throw new Error(`User with id ${userId} does not exist`);
		if (
			channel.banned_users.some(
				(banned_user) => banned_user.id === userId,
			)
		)
			throw new Error(
				`User with id ${userId} is banned from channel with id ${channelId}`,
			);
		channel.members.push(user);
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelCreated', { channelCreated: savedChannel });
		return savedChannel;
	}

	async joinPrivate(
		userId: string,
		channelId: string,
		password: string,
	): Promise<boolean> {
		const channel = await this.getChannelById(channelId, {
			banned_users: true,
			members: true,
		});
		const user = await this.userService.getUserById(userId);

		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		if (!user) throw new Error(`User with id ${userId} does not exist`);
		if (
			channel.banned_users.some(
				(banned_user) => banned_user.id === userId,
			)
		)
			throw new Error(
				`User with id ${userId} is banned from channel with id ${channelId}`,
			);
		const same_password = await new Promise<boolean>((resolve, reject) => {
			bcrypt.compare(password, channel.password, function (err, result) {
				if (err) reject(err);
				resolve(result);
			});
		});
		if (same_password) {
			channel.members.push(user);
			const savedChannel = await this.channelRepository.save(channel);
			pubSub.publish('channelCreated', { channelCreated: savedChannel });
			return true;
		}
		return false;
	}

	async mute(
		channelId: string,
		supposed_admin_id: string,
		userId: string,
		timeout: number,
	) {
		const channel = await this.getChannelById(channelId, {
			owner: true,
			admins: true,
			members: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		if (!channel.admins.some((admin) => admin.id === supposed_admin_id))
			throw new Error(`Only admins can mute members`);
		const index = channel.members.findIndex(
			(member) => member.id === userId,
		);
		if (index < 0)
			throw new Error(`User with id ${userId} is not a member`);
		if (channel.owner.id != supposed_admin_id) {
			if (channel.admins.some((admin) => admin.id === userId))
				throw new Error(
					`User with id ${userId} is an admin, can only kick non-admins`,
				);
		}
		const timeoutId = setTimeout(
			() => this.unmute(channelId, userId),
			timeout * 60 * 1000,
		);
		if (this.isMuted(userId, channelId)) {
			const index = mute_table[channelId].findIndex(
				(user) => user[0] === userId,
			);
			clearTimeout(mute_table[channelId][index][1]);
			mute_table[channelId][index][1] = timeoutId;
			return channel;
		}
		if (!mute_table[channelId]) {
			mute_table[channelId] = [];
		}
		mute_table[channelId].push([userId, timeoutId]);
		return channel;
	}

	isMuted(userId: string, channelId: string): boolean {
		if (!mute_table[channelId]) return false;
		return mute_table[channelId].some((user) => user[0] === userId);
	}

	private async unmute(channelId: string, userId: string) {
		if (!mute_table[channelId]) return;
		const index = mute_table[channelId].findIndex(
			(user) => user[0] == userId,
		);
		mute_table[channelId].splice(index, 1);
	}

	async kick(channelId: string, supposed_admin_id: string, userId: string) {
		const channel = await this.getChannelById(channelId, {
			owner: true,
			admins: true,
			members: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		if (!channel.admins.some((admin) => admin.id === supposed_admin_id))
			throw new Error(`Only admins can kick members`);
		const index = channel.members.findIndex(
			(member) => member.id === userId,
		);
		if (index < 0)
			throw new Error(`User with id ${userId} is not a member`);
		if (channel.owner.id != supposed_admin_id) {
			if (channel.admins.some((admin) => admin.id === userId))
				throw new Error(
					`User with id ${userId} is an admin, can only kick non-admins`,
				);
		} else {
			if (channel.admins.some((admin) => admin.id === userId)) {
				const admin_index = channel.admins.findIndex(
					(admin) => admin.id === userId,
				);
				channel.admins.splice(admin_index, 1);
			}
		}
		channel.members.splice(index, 1);
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelUpdated', { channelUpdated: savedChannel });
		return savedChannel;
	}

	async ban(channelId: string, supposed_admin_id: string, userId: string) {
		const channel = await this.getChannelById(channelId, {
			owner: true,
			admins: true,
			banned_users: true,
			members: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		if (!channel.admins.some((admin) => admin.id === supposed_admin_id))
			throw new Error(`Only admins can ban members`);
		const index = channel.members.findIndex(
			(member) => member.id === userId,
		);
		if (index < 0)
			throw new Error(`User with id ${userId} is not a member`);
		if (channel.owner.id != supposed_admin_id) {
			if (channel.admins.some((admin) => admin.id === userId))
				throw new Error(
					`User with id ${userId} is an admin, can only ban non-admins`,
				);
		} else {
			if (channel.admins.some((admin) => admin.id === userId)) {
				const admin_index = channel.admins.findIndex(
					(admin) => admin.id === userId,
				);
				channel.admins.splice(admin_index, 1);
			}
		}
		channel.banned_users.push(channel.members[index]);
		channel.members.splice(index, 1);
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelUpdated', { channelUpdated: savedChannel });
		return savedChannel;
	}

	async unban(channelId: string, supposed_admin_id: string, userId: string) {
		const channel = await this.getChannelById(channelId, {
			owner: true,
			admins: true,
			members: true,
			banned_users: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channelId} does not exist`);
		if (!channel.admins.some((admin) => admin.id === supposed_admin_id))
			throw new Error(`Only admins can unban members`);
		const index = channel.banned_users.findIndex(
			(user) => user.id === userId,
		);
		if (index < 0) throw new Error(`User with id ${userId} is not banned`);
		channel.banned_users.splice(index, 1);
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelUpdated', { channelUpdated: savedChannel });
		return savedChannel;
	}

	async promote(
		channel_id: string,
		supposed_owner_id: string,
		user_id: string,
	) {
		const channel = await this.getChannelById(channel_id, {
			owner: true,
			members: true,
			admins: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channel_id} does not exist`);
		if (channel.owner.id !== supposed_owner_id)
			throw new Error(
				`User with id ${supposed_owner_id} is not the channel owner`,
			);
		const user = await this.userService.getUserById(user_id);
		if (!user) throw new Error(`User with id ${user_id} does not exist`);
		if (!channel.members.some((member) => member.id === user_id))
			throw new Error(`User with id ${user_id} is not a member`);
		channel.admins.push(user);
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelUpdated', { channelUpdated: savedChannel });
		return savedChannel;
	}

	async demote(
		channel_id: string,
		supposed_owner_id: string,
		user_id: string,
	) {
		const channel = await this.getChannelById(channel_id, {
			owner: true,
			members: true,
			admins: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channel_id} does not exist`);
		if (channel.owner.id !== supposed_owner_id)
			throw new Error(
				`User with id ${supposed_owner_id} is not the channel owner`,
			);
		const index = channel.admins.findIndex((admin) => admin.id === user_id);
		if (index < 0)
			throw new Error(`User with id ${user_id} is not an admin`);
		channel.admins.splice(index, 1);
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelUpdated', { channelUpdated: savedChannel });
		return savedChannel;
	}

	async getMutedMembers(channel: GroupChat): Promise<Array<User>> {
		if (!mute_table[channel.id]) return [];
		const channel_with_members = await this.getChannelById(channel.id, {
			members: true,
		});
		return mute_table[channel.id].map((userId) =>
			channel_with_members.members.find((user) => user.id === userId[0]),
		);
	}

	async getMembers(channel: GroupChat): Promise<Array<User>> {
		const channel_with_members = await this.channelRepository.findOne({
			relations: { members: true },
			where: { id: channel.id },
		});
		return channel_with_members.members;
	}

	async getOwner(channel: GroupChat): Promise<User> {
		const channel_with_owner = await this.channelRepository.findOne({
			relations: { owner: true },
			where: { id: channel.id },
		});
		return channel_with_owner.owner;
	}

	async getAdmins(channel: GroupChat): Promise<Array<User>> {
		const channel_with_admins = await this.channelRepository.findOne({
			relations: { admins: true },
			where: { id: channel.id },
		});
		return channel_with_admins.admins;
	}

	async getBannedUsers(channel: GroupChat): Promise<Array<User>> {
		const channel_with_banned_users = await this.channelRepository.findOne({
			relations: { banned_users: true },
			where: { id: channel.id },
		});
		return channel_with_banned_users.banned_users;
	}

	async getMessages(channel: GroupChat): Promise<Array<GroupMessage>> {
		const channel_with_messages = await this.channelRepository.findOne({
			relations: { messages: true },
			where: { id: channel.id },
		});
		return channel_with_messages.messages;
	}

	async leaveGroupChat(channel_id: string, user_id: string) {
		const channel = await this.getChannelById(channel_id, {
			owner: true,
			members: true,
			admins: true,
		});
		if (!channel)
			throw new Error(`Channel with id ${channel_id} does not exist`);
		const admin_index = channel.admins.findIndex(
			(admin) => admin.id === user_id,
		);
		if (admin_index >= 0) channel.admins.splice(admin_index, 1);
		const member_index = channel.members.findIndex(
			(member) => member.id === user_id,
		);
		if (member_index >= 0) channel.members.splice(member_index, 1);
		else throw new Error(`User ${user_id} is not in channel ${channel_id}`);
		if (channel.owner.id === user_id) {
			let new_owner: User;
			if (channel.admins[0]) {
				new_owner = channel.admins[0];
			} else if (channel.members[0]) {
				new_owner = channel.members[0];
				const user = await this.userService.getUserById(
					channel.members[0].id,
				);
				if (!user)
					throw new Error(`User with id ${user_id} does not exist`);
				channel.admins.push(user);
			} else {
				this.channelRepository.delete(channel.id);
				return channel;
			}
			channel.owner = new_owner;
		}
		const savedChannel = await this.channelRepository.save(channel);
		pubSub.publish('channelCreated', { channelCreated: savedChannel });
		return savedChannel;
	}

	async changePassword(
		user_id: string,
		channel_id: string,
		old_password: string,
		new_password: string,
	) {
		const channel = await this.getChannelById(channel_id, { owner: true });
		if (!channel)
			throw new Error(`Channel with id ${channel_id} does not exist`);
		if (channel.owner.id !== user_id)
			throw new Error(`User with id ${user_id} is not the owner`);
		const same_password = await new Promise<boolean>((resolve, reject) => {
			bcrypt.compare(
				old_password,
				channel.password,
				function (err, result) {
					if (err) reject(err);
					resolve(result);
				},
			);
		});
		if (same_password) {
			const salt_rounds = 10;
			const promise = new Promise<string>((resolve, reject) => {
				bcrypt.hash(new_password, salt_rounds, function (err, hash) {
					if (err) reject(err);
					resolve(hash);
				});
			});
			channel.password = await promise;
			await this.channelRepository.save(channel);
			return true;
		} else {
			return false;
		}
	}

	async isNotAMemberOfChannel(user_id: string, channel_id: string) : Promise<boolean> {
		const channel = await this.getChannelById(channel_id, { members: true });
		const check = channel.members.findIndex((member) => member.id === user_id);
		if (check >= 0) {
			return false;
		}
		return true;
	}

}
