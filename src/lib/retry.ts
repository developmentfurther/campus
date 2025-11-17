export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 5,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (attempts <= 1) throw err;
    await new Promise(res => setTimeout(res, delay));
    return retry(fn, attempts - 1, delay * 2); // backoff exponencial
  }
}
