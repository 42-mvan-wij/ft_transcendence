import { Module } from "@nestjs/common";
import { UserActivityService } from "./user-activity.service";
import { QueueModule } from "src/pong/queue/queue.module";

@Module({
	providers: [UserActivityService],
	imports: [QueueModule]
})
export class UserActivityModule {}