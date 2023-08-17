import { Module, forwardRef } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { QueueModule } from 'src/pong/queue/queue.module';
import { UserActivityResolver } from './user-activity.resolver';

@Module({
	imports: [forwardRef(() => QueueModule)],
	providers: [UserActivityService, UserActivityResolver],
	exports: [UserActivityService],
})
export class UserActivityModule {}
