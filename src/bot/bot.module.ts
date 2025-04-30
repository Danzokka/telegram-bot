import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BotService } from './bot.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
