import { getFromEnv } from 'src/shared/utils';

export enum ENV_KEYS {
  APPLE_MERCHANT_ID = 'APPLE_MERCHANT_ID',
  NODE_ENV = 'NODE_ENV',
  PORT='PORT',
  HOST='HOST',
}

export interface ApplePayConfig {
  [ENV_KEYS.APPLE_MERCHANT_ID]: string;
}

export default function () {
  const { APPLE_MERCHANT_ID } = ENV_KEYS;

  return {
    apple: {
      [APPLE_MERCHANT_ID]: getFromEnv(APPLE_MERCHANT_ID, {
        throwOnFail: true,
      }),
    },
  };
}
