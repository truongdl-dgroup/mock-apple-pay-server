import { ApplePayHttpService } from './apple-pay-http.service';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MerchantSessionService } from './merchant-session.service';
import { MerchantSessionController } from './merchant-session.controller';
import { HttpModule } from '@nestjs/axios';
import merchantSessionHttpFactory from './factories/merchant-session-http-factory';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: merchantSessionHttpFactory,
      inject: [ConfigService],
    }),
  ],
  controllers: [MerchantSessionController],
  providers: [MerchantSessionService, ApplePayHttpService],
})
export class MerchantSessionModule {}
