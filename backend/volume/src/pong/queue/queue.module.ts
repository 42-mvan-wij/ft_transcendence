import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueResolver } from './queue.resolver';
import { UserModule } from 'src/user/user.module';
import { UserActivityModule } from 'src/user/user-activity.module';

@Module({
	imports: [UserModule, forwardRef(() => UserActivityModule)],
	providers: [QueueService, QueueResolver],
	exports: [QueueService],
})
export class QueueModule {}
