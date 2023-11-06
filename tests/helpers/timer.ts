export function fakeSetTimeout (callback: () => void): NodeJS.Timeout {
  callback()
  return new NodeJS.Timeout()
}
