import { Global, Module } from '@nestjs/common';
import { AppLoggerModule } from './app-logger/app-logger.module';

@Module({
  imports: [AppLoggerModule],
  exports: [AppLoggerModule],
})
@Global()
export class SharedModule {}
