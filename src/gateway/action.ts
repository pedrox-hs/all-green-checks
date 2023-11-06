import 'reflect-metadata'

import container from '../di'
import { WaitUntilAllChecksCompletedUseCase } from '../domain/WaitUntilAllChecksCompleted'
import { Logger } from '../utils'

export default async function main () {
  const logger = container.resolve<Logger>('Logger')
  try {
    const token = container.resolve('GITHUB_TOKEN')
    if (!token) throw new Error('The `GITHUB_TOKEN` must be set')

    const waitUntilAllChecksCompleted = container.resolve(WaitUntilAllChecksCompletedUseCase)
    await waitUntilAllChecksCompleted.run()
  } catch (error) {
    logger.error(error)
  }
}

/* c8 ignore next */
if (require.main === module) main()
