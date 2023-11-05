import { inject, injectable } from 'tsyringe'
import { IsAllChecksCompletedUseCase } from './IsAllChecksCompleted'
import { Duration } from './entities'
import { IVersionControlSystemRepository } from './repository'

@injectable()
export class WaitUntilAllChecksCompletedUseCase {
  private isAllChecksCompleted: IsAllChecksCompletedUseCase
  private repository: IVersionControlSystemRepository

  constructor (
    isAllChecksCompleted: IsAllChecksCompletedUseCase,
    @inject('IVersionControlSystemRepository')
    repository: IVersionControlSystemRepository,
  ) {
    this.isAllChecksCompleted = isAllChecksCompleted
    this.repository = repository
  }

  /**
   * Wait until all checks are completed
   *
   * @throws {Error} if not all checks are successful
   * @returns {Promise<void>}
   */
  async run () {
    const checkInterval = await this.getCheckInterval()
    let hasPendingChecks = true
    while (hasPendingChecks) {
      hasPendingChecks = !await this.isAllChecksCompleted.run()
      if (hasPendingChecks) await this.waitNextCheck(checkInterval)
    }
  }

  /**
   * Wait for the next check
   */
  private async waitNextCheck (checkInterval: Duration) {
    await new Promise(resolve => setTimeout(resolve, checkInterval))
  }

  /**
   * Get the check interval
   *
   * @throws {Error} if the check interval is not a number or is not positive
   * @returns {Promise<Duration>} the check interval
   */
  private async getCheckInterval (): Promise<Duration> {
    const options = await this.repository.getOptions()
    if (isNaN(options.checkInterval)) throw new Error('The `check-interval` must be a number')
    if (options.checkInterval <= 0) throw new Error('The `check-interval` must be positive')
    return options.checkInterval * 1000
  }
}
