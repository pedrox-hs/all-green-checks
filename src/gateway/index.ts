import { DependencyContainer } from 'tsyringe'
import { WaitUntilAllChecksCompletedUseCase } from '../domain/WaitUntilAllChecksCompleted'
import { Logger } from '../utils'

export async function main (container: DependencyContainer) {
  const logger = container.resolve<Logger>('Logger')
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) throw new Error('The `GITHUB_TOKEN` must be set')
    container.register('GITHUB_TOKEN', { useValue: token })

    const waitUntilAllChecksCompleted = container.resolve(WaitUntilAllChecksCompletedUseCase)
    await waitUntilAllChecksCompleted.run()
  } catch (error) {
    logger.error(error)
  }
}
