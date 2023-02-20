import { Body, Controller, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { withCatchAsync } from "src/shared/utils";
import { AppLogger } from "../../shared/app-logger/app-logger.service";
import { ApplePayHttpService } from "./apple-pay-http.service";
import { MerchantSessionService } from "./merchant-session.service";
import { decryptPaymentData } from "./utils/payment-token-decrypt.util";

@Controller('payment-session')
export class MerchantSessionController {
  constructor(
    private readonly merchantSessionService: MerchantSessionService,
    private readonly configService: ConfigService,
    private readonly applePayHttpService: ApplePayHttpService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(MerchantSessionController.name);
  }

  @Post('new')
  async requestNewPaymentSession(
    @Body('validation-url') validationUrl = 'https://apple-pay-gateway-cert.apple.com/paymentservices/startSession',
  ) {

    const __requestData = () =>
      this.applePayHttpService.requestNewMerchantPaymentSession({
        validationUrl,
      });

    const [session, validationError] = await withCatchAsync(__requestData);

    console.error(validationError);
    if (validationError) {
      this.logger.error(validationError.response.data);
    }
    if (session) {
      this.logger.log(session.data);
    }

    return session.data;
  }

  @Post('authorized')
  async processPayment(@Body() body) {
    this.logger.log(body);

    const payload = await decryptPaymentData(body.token);

    console.log(payload);

    // do something with the payload

    // status: 0 === success
    return { status: 0 };
  }
}
