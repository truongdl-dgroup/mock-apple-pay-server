import * as fs from 'fs';
import * as cryptoNative from 'crypto';
import * as path from 'path';
import * as pkijs from 'pkijs';
import * as ECKey from 'ec-key';
import * as x509 from '@fidm/x509';
import { Crypto } from '@peculiar/webcrypto';

const crypto: any = new Crypto();

pkijs.setEngine(
  'WebCrypto',
  crypto,
  new pkijs.CryptoEngine({ name: '', crypto, subtle: crypto.subtle }),
);

export async function decryptPaymentData(paymentToken) {
  const appleCert = fs.readFileSync(
    path.join(process.cwd(), 'cert', 'payment_process_cert.pem'),
    { encoding: 'utf-8' },
  );

  // 1. verify signature
  // TODO: temporary bypass the verify signature
  // await verifySignature(paymentToken);

  // 2. Use the value of the publicKeyHash key to determine which merchant public key was used
  if (
    !checkPublicKeyHash(
      paymentToken.paymentData.header.publicKeyHash,
      appleCert,
    )
  ) {
    throw new Error('Public key hash does not match');
  }

  const privateKey = fs.readFileSync(
    path.join(process.cwd(), 'cert', 'payment_process_key.pem'),
    { encoding: 'utf-8' },
  );

  // 3. restore symmetric key for ECC
  const symmetricKey = restoreSymmetricKey({
    privateKey,
    ephemeralPublicKey: paymentToken.paymentData.header.ephemeralPublicKey,
    publicCert: appleCert,
  });

  const value = decryptCiphertextFunc(
    symmetricKey,
    paymentToken.paymentData.data,
  );

  return JSON.parse(value.toString());
}

function extractSignedDataFromSignature(signature) {
  const cmsSignedBuffer = Buffer.from(signature, 'base64');
  const cmsContentSimpl = pkijs.ContentInfo.fromBER(cmsSignedBuffer);
  const cmsSignedDataSimpl = new pkijs.SignedData({
    schema: cmsContentSimpl.content,
  });

  return { content: cmsContentSimpl, signedData: cmsSignedDataSimpl };
}

async function verifySignature(token) {
  const { signature } = token.paymentData;

  const { signedData } = extractSignedDataFromSignature(signature);

  // 1.a Ensure that the certificates contain the correct custom OIDs: 1.2.840.113635.100.6.29
  // for the leaf certificate and 1.2.840.113635.100.6.2.14 for the intermediate CA
  verifyCustomOIDs(signedData.certificates);

  // 1.b Ensure that the root CA is the Apple Root CA - G3
  // root CA downloaded from Apple web site so we're good

  // 1.c Ensure that there is a valid X.509 chain of trust from the signature to the root CA
  // 1.d Validate the token’s signature
  // PKI.js can check chain of trust and verify on one shot, so 1.c and 1.d can be done together
  const AppleRootCABuffer = fs.readFileSync(
    path.join(process.cwd(), 'cert', 'AppleRootCA-G3.cer'),
  );
  const rootCA = pkijs.Certificate.fromBER(
    new Uint8Array(AppleRootCABuffer).buffer,
  );

  const signatureValidationResult =
    await ensureSignatureChainOfTrustAndValidateTokenSignature({
      cmsSignedData: signedData,
      token,
      rootCA,
    });

  if (!signatureValidationResult.signatureVerified) {
    throw new Error('CMS signed data verification failed');
  }

  const signerInfo = signedData.signerInfos[0];

  // 1.e Inspect the CMS signing time of the signature
  await checkSigningTime(signerInfo);
}

function checkSigningTime(signerInfo) {
  const SIGNINGTIME_OID = '1.2.840.113549.1.9.5';
  // FIXME: infinity time -> 5 minutes
  const TOKEN_EXPIRE_WINDOW = 5 * 60 * 10000;

  const signerInfoAttrs = signerInfo.signedAttrs.attributes;
  const attr = signerInfoAttrs.find((x) => x.type === SIGNINGTIME_OID);
  const signedTime = new Date(attr.values[0].toDate()).getTime();
  const now = Date.now();

  if (now - signedTime > TOKEN_EXPIRE_WINDOW) {
    throw new Error('Signature has expired');
  }
}

async function ensureSignatureChainOfTrustAndValidateTokenSignature({
  token,
  rootCA,
  cmsSignedData,
}: {
  token: any;
  rootCA: pkijs.Certificate;
  cmsSignedData: pkijs.SignedData;
}) {
  const { paymentData } = token;

  const ephemeralPublicKey = Buffer.from(
    paymentData.header.ephemeralPublicKey,
    'base64',
  );
  const data = Buffer.from(paymentData.data, 'base64');
  const transactionId = Buffer.from(paymentData.header.transactionId, 'hex');
  const applicationData = Buffer.from(
    paymentData.header.applicationData || '',
    'hex',
  );
  const signedData = Buffer.concat([
    ephemeralPublicKey,
    data,
    transactionId,
    applicationData,
  ]);

  return await cmsSignedData.verify({
    signer: 0,
    trustedCerts: [rootCA],
    data: signedData,
    checkChain: false, // check x509 chain of trust
    extendedMode: true, // enable to show signature validation result
  });
}

function verifyCustomOIDs(certificates) {
  // just verify that both of them are exists (value doesn't matter)
  const LEAF_CERTIFICATE_OID = '1.2.840.113635.100.6.29';
  const INTERMEDIATE_CA_OID = '1.2.840.113635.100.6.2.14';

  if (certificates.length !== 2) {
    throw new Error(
      `Signature certificates number error: expected 2 but got ${certificates.length}`,
    );
  }
  if (
    !certificates[0].extensions.find((x) => x.extnID === LEAF_CERTIFICATE_OID)
  ) {
    throw new Error(
      `Leaf certificate doesn't have extension: ${LEAF_CERTIFICATE_OID}`,
    );
  }
  if (
    !certificates[1].extensions.find((x) => x.extnID === INTERMEDIATE_CA_OID)
  ) {
    throw new Error(
      `Intermediate certificate doesn't have extension: ${INTERMEDIATE_CA_OID}`,
    );
  }
}

function checkPublicKeyHash(publicKeyHash, publicCert) {
  const info = x509.Certificate.fromPEM(publicCert);
  const subjectPublicKeyInfo = info.publicKeyRaw;
  const hash = cryptoNative
    .createHash('sha256')
    .update(subjectPublicKeyInfo)
    .digest('base64');
  return hash === publicKeyHash;
}

function sharedSecretFunc(ephemeralPublicKey, privateKey) {
  const prv = new ECKey(privateKey, 'pem'); // Create a new ECkey instance from PEM formatted string
  const publicEc = new ECKey(ephemeralPublicKey, 'spki'); // Create a new ECKey instance from a base-64 spki string
  return prv.computeSecret(publicEc).toString('hex'); // Compute secret using private key for provided ephemeral public key
}

function restoreSymmetricKey({ privateKey, ephemeralPublicKey, publicCert }) {
  const sharedSecret = sharedSecretFunc(ephemeralPublicKey, privateKey);

  // 3.b Use the merchant identifier of the public key certificate and the shared secret, to derive the symmetric key
  const merchantId = merchantIdFunc(publicCert);

  const result = symmetricKeyFunc(merchantId, sharedSecret);

  return result;
}

function merchantIdFunc(publicCert) {
  const MERCHANT_ID_FIELD_OID = '1.2.840.113635.100.6.32';
  try {
    const info = x509.Certificate.fromPEM(publicCert);
    const picked = info.extensions.find((x) => x.oid === MERCHANT_ID_FIELD_OID);
    return picked.value.toString().substring(2);
  } catch (err) {
    throw new Error(`Unable to extract merchant ID from certificate: ${err}`);
  }
}

function symmetricKeyFunc(merchantId, sharedSecret) {
  const KDF_ALGORITHM = '\x0did-aes256-GCM'; // The byte (0x0D) followed by the ASCII string "id-aes256-GCM". The first byte of this value is an unsigned integer that indicates the string’s length in bytes; the remaining bytes are a constiable-length string.
  const KDF_PARTY_V = Buffer.from(merchantId, 'hex').toString('binary'); // The SHA-256 hash of your merchant ID string literal; 32 bytes in size.
  const KDF_PARTY_U = 'Apple'; // The ASCII string "Apple". This value is a fixed-length string.
  const KDF_INFO = KDF_ALGORITHM + KDF_PARTY_U + KDF_PARTY_V;

  const hash = cryptoNative.createHash('sha256');
  hash.update(Buffer.from('000000', 'hex'));
  hash.update(Buffer.from('01', 'hex'));
  hash.update(Buffer.from(sharedSecret, 'hex'));
  hash.update(KDF_INFO, 'binary');

  return hash.digest('hex');
}

function decryptCiphertextFunc(symmetricKey, data) {
  const buf = Buffer.from(data, 'base64');
  const SYMMETRIC_KEY = Buffer.from(symmetricKey, 'hex');
  const IV = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Initialization vector of 16 null bytes
  const CIPHERTEXT = buf.slice(0, -16);
  const decipher = cryptoNative.createDecipheriv(
    'aes-256-gcm',
    SYMMETRIC_KEY,
    IV,
  ); // Creates and returns a Decipher object that uses the given algorithm and password (key)
  const tag = buf.slice(-16, buf.length);

  decipher.setAuthTag(tag);
  let decrypted = decipher.update(CIPHERTEXT);

  decrypted += decipher.final() as any;
  return decrypted;
}
