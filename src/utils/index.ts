export type Logger = {
  info(message: unknown, ...args: unknown[]): void
  error(message: unknown, ...args: unknown[]): void
}
