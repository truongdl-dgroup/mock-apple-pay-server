import { isNil } from '../data-types/isNil';

export function getFromEnv(key: string, options = { throwOnFail: false }) {
  const { throwOnFail } = options;

  const value = process.env[key];

  if (isNil(value) && throwOnFail) {
    throw new ReferenceError(`The env key {${key}} was not found!`);
  }

  return value;
}
