import { Module } from '@nestjs/common';
import { MerchantSessionModule } from './features/merchant-session/merchant-session.module';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.production'],
      load: [configuration],
      isGlobal: true,
    }),
    MerchantSessionModule,
    SharedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
