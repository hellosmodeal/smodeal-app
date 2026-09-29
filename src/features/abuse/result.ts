export function assertMutationSucceeded(result: unknown): void {
  if (
    typeof result === 'object' &&
    result !== null &&
    'ok' in result &&
    result.ok === false &&
    'message' in result &&
    typeof result.message === 'string'
  ) {
    throw new Error(result.message)
  }
}
