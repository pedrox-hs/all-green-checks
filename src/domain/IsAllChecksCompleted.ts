import { inject, injectable } from 'tsyringe'
import { Logger } from '../utils'
import { IVersionControlSystemRepository } from './repository'
import { Conclusion, Job, Status } from './entities'

@injectable()
export class IsAllChecksCompletedUseCase {
  private logger: Logger
  private repository: IVersionControlSystemRepository

  constructor (
    @inject('Logger')
      logger: Logger,
    @inject('IVersionControlSystemRepository')
      repository: IVersionControlSystemRepository,
  ) {
    this.repository = repository
    this.logger = logger
  }

  /**
   * Check if all checks are completed
   *
   * @throws {Error} if not all checks are successful
   * @returns {Promise<boolean>}
   */
  async run (): Promise<boolean> {
    const ignoredJobs = await this.getIgnoredJobs()
    const checkRuns = await this.repository.getCheckRuns()
      .then((checks) => checks.filter(checkRun => !ignoredJobs.includes(checkRun.name)))

    const pendingChecks = checkRuns.filter(checkRun => checkRun.status !== Status.Completed)
    if (pendingChecks.length > 0) {
      const formattedPendingChecks = pendingChecks.map(checkRun => `${checkRun.name} (${checkRun.status})`)
      this.logger.info(`Pending checks: ${formattedPendingChecks.join(', ')}`)
      return false
    }

    const allSuccess = checkRuns
      .every(checkRun => checkRun.conclusion === Conclusion.Success || checkRun.conclusion === Conclusion.Neutral)

    if (!allSuccess) throw new Error('Not all checks are successful')

    return true
  }

  /**
   * Get the ignored jobs
   *
   * @returns {Promise<Job[]>}
   */
  private async getIgnoredJobs (): Promise<Job[]> {
    const options = await this.repository.getOptions()
    return options.ignoredJobs
  }
}
