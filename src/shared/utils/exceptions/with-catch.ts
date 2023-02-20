export function withCatch<T>(callback: () => T) {
  const result = [,];
  try {
    const data = callback();
    result[0] = data;
  } catch (error) {
    result[1] = error;
  }

  return result;
}

export async function withCatchAsync<T>(promise: () => Promise<T>) {
  const result = [,];
  try {
    const data = await promise();
    result[0] = data;
  } catch (error) {
    result[1] = error;
  }

  return result;
}
