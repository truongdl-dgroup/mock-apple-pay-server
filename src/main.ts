import { NestFactory } from '@nestjs/core';
import { ConfigService } from "@nestjs/config";
import { AppModule } from './app.module';
import { ENV_KEYS } from "./config/configuration";

import './base';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*', credentials: false });

  const configService = app.get<ConfigService>(ConfigService);

  const port = configService.get<number>(ENV_KEYS.PORT, 3002);
  const host = configService.get<string>(ENV_KEYS.HOST, '0.0.0.0');

  await app.listen(port, host, async () => {
    console.log('Listening on: ', await app.getUrl());
  });
}

bootstrap();
