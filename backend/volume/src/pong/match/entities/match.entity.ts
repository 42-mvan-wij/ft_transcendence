import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	ManyToMany,
	CreateDateColumn,
} from 'typeorm';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';

@Entity()
@ObjectType()
export class Match {
	@PrimaryGeneratedColumn('uuid')
	@Field()
	id: string;

	@CreateDateColumn()
	@Field()
	matchDate: Date;

	@ManyToMany(() => User, (user) => user.match_history)
	@Field(() => [User])
	players: User[];

	@Column()
	@Field(() => Int)
	p1Score: number;

	@Column()
	@Field(() => Int)
	p2Score: number;

	@Column()
	@Field(() => Boolean)
	isFinished: boolean;
}
