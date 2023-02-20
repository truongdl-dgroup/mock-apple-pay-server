import { HttpModuleOptions } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Agent as HttpsAgent } from 'https';
import * as fs from 'fs';
import * as path from 'path';

export default function (configService: ConfigService): HttpModuleOptions {
  const appleCertificate = fs.readFileSync(
    path.join(process.cwd(), 'cert', 'merchant_id.pem'),
    'utf-8',
  );

  const httpsAgent = new HttpsAgent({
    cert: appleCertificate,
    key: appleCertificate,
    rejectUnauthorized: false,
  });

  return { httpsAgent };
}
