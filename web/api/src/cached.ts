export function cached<T extends readonly unknown[], R>(
  cacheable: (...args: T) => R,
  timeout: number | null = null,
): (...args: T) => Promise<Awaited<R>> {
  let expireAt = Date.now() + (timeout ?? 0)
  let value: Awaited<R> | undefined = undefined
  return async (...args: T): Promise<Awaited<R>> => {
    const isExpired = Date.now() >= expireAt
    if (value === undefined || isExpired) {
      try {
        value = await cacheable(...args)
        expireAt = Date.now() + (timeout ?? 0)
      } catch (e) {
        expireAt = Date.now()
        throw e
      }
    }
    return value
  }
}
