import { ApplePayConfig } from 'src/config/configuration';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

type RequestNewMerchantPaymentSessionType = {
  validationUrl: string;
  payload?: Record<string, any>;
};

@Injectable()
export class ApplePayHttpService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private __getAppleConfig() {
    return this.configService.get<ApplePayConfig>('apple');
  }

  async requestNewMerchantPaymentSession(
    params: RequestNewMerchantPaymentSessionType,
  ) {
    const { validationUrl, payload = {} } = params;

    const { APPLE_MERCHANT_ID } = this.__getAppleConfig();

    const defaultRequestNewSessionPayload = {
      merchantIdentifier: APPLE_MERCHANT_ID,
      displayName: 'AhaDSVDevTest',
      initiative: 'web',
      initiativeContext: 'local.aha.is',
    };

    const requestNewSessionPayload = Object.merge(
      defaultRequestNewSessionPayload,
      payload,
    );

    console.log(requestNewSessionPayload);

    const result = await firstValueFrom(
      this.httpService.post(validationUrl, requestNewSessionPayload),
    );

    return result;
  }
}
