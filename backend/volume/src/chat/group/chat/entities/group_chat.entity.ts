import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { GroupMessage } from '../../message/entities/group_message.entity';

@Entity()
@ObjectType()
export class GroupChat {
	@PrimaryGeneratedColumn('uuid')
	@Field()
	id: string;

	@ManyToMany(() => User, (user) => user.group_chats)
	@JoinTable()
	@Field(() => [User], { nullable: true })
	members: User[];

	@ManyToOne(() => User)
	@Field(() => User)
	owner: User;

	@ManyToMany(() => User)
	@JoinTable()
	@Field(() => [User])
	admins: User[];

	@Field(() => [User], { nullable: true })
	muted_members: User[];

	@ManyToMany(() => User)
	@JoinTable()
	@Field(() => [User], { nullable: true })
	banned_users: User[];

	@OneToMany(() => GroupMessage, (message) => message.channel, { onDelete: "SET NULL" })
	@Field(() => [GroupMessage], { nullable: true })
	messages: GroupMessage[];

	@Column()
	@Field(() => String, {
		description: 'name of the channel',
	})
	name: string;

	@Column()
	@Field(() => String, {
		description: 'logo of the channel',
	})
	logo: string;

	@Column({ nullable: true })
	password: string;

	@Field(() => GroupMessage, { nullable: true })
	lastMessage: GroupMessage;

	@Column({ default: true })
	@Field(() => Boolean, {
		description: 'Determines if the channel is public or not',
	})
	isPublic: boolean;
}
