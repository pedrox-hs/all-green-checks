import * as core from '@actions/core'
import { components } from '@octokit/openapi-types'
import { Repository } from '@octokit/webhooks-types'
import { Context } from 'probot'

type CheckRun = components['schemas']['check-run']

type ActionInputs = {
  jobName: string
  checkInterval: number
}

/**
 * The AllGreenAction class
 **/
export class AllGreenAction {
  /**
   * The context of the event
   */
  context: Context

  /**
   * The ref to check the checks for
   */
  checksRef: string

  /**
   * The name of the job that runs this action
   * This job will be ignored when checking for pending checks
   * This is to prevent the action from waiting for itself
   **/
  selfJobName: string

  /**
   * The interval to check for pending checks
   * This is to prevent the action from spamming the API
   **/
  checkInterval: number

  /**
   * The repository of the event
   **/
  repository: Repository

  /**
   * Create a new AllGreenAction
   * @param context The context of the event
   * @param repository The repository of the event
   * @param checksRef The ref to check the checks for
   * @param inputs The inputs for the action
   **/
  constructor (context: Context, repository: Repository, checksRef: string, inputs: ActionInputs) {
    this.validateInputs(inputs)
    this.context = context
    this.repository = repository
    this.checksRef = checksRef
    this.selfJobName = inputs.jobName
    this.checkInterval = inputs.checkInterval * 1000
  }

  /**
   * Run the action
   */
  async run () {
    core.info('Running checks')
    await this.waitUntilAllChecksCompleted()
  }

  private validateInputs (inputs: ActionInputs) {
    // check if the interval is a number
    if (isNaN(inputs.checkInterval)) {
      throw new Error('The `check-interval` must be a number')
    }

    // check if the interval is positive
    if (inputs.checkInterval <= 0) {
      throw new Error('The `check-interval` must be positive')
    }
  }

  /**
   * Wait until all checks are completed
   */
  private async waitUntilAllChecksCompleted () {
    let hasPendingChecks = true
    while (hasPendingChecks) {
      hasPendingChecks = !await this.isAllChecksCompleted()
      await this.waitNextCheck()
    }
  }

  /**
   * Check if all checks are completed
   *
   * @returns Whether all checks are completed
   */
  private async isAllChecksCompleted (): Promise<boolean> {
    const checkRuns = await this.getCheckRuns()
    if (checkRuns.length === 0) return false

    const pendingChecks = checkRuns.filter(checkRun => checkRun.status !== 'completed')
    if (pendingChecks.length > 0) {
      const formattedPendingChecks = pendingChecks.map(checkRun => `${checkRun.name} (${checkRun.status})`)
      core.info(`Pending checks: ${formattedPendingChecks.join(', ')}`)
      return false
    }

    const allSuccess = checkRuns
      .every(checkRun => checkRun.conclusion === 'success' || checkRun.conclusion === 'neutral')
    if (!allSuccess) throw new Error('Not all checks are successful')

    return true
  }

  /**
   * Get the check runs for the current commit
   *
   * @returns The check runs for the current commit
   */
  private async getCheckRuns (): Promise<CheckRun[]> {
    const { data: { check_runs: checkRuns } } = await this.context.octokit.rest.checks.listForRef({
      owner: this.repository.owner.login,
      repo: this.repository.name,
      ref: this.checksRef,
      per_page: 100,
    })

    return checkRuns.filter(checkRun => checkRun.name !== this.selfJobName)
  }

  /**
   * Wait for the next check
   */
  private async waitNextCheck () {
    await new Promise((resolve) => setTimeout(resolve, this.checkInterval))
  }
}

/**
 * Run the AllGreenAction
 *
 * @param context The context of the event
 * @param repository The repository of the event
 * @param checksRef The ref to check the checks for
 */
export async function runAllGreenAction (
  context: Context,
  repository: Repository,
  checksRef: string,
) {
  try {
    const allGreen = new AllGreenAction(
      context,
      repository,
      checksRef,
      {
        jobName: core.getInput('self-job-name', { required: true }),
        checkInterval: parseInt(core.getInput('check-interval', { trimWhitespace: true, required: true })),
      },
    )
    await allGreen.run()
  } catch (error) {
    setRunFailed(error)
  }
}

/**
 * Set the run as failed
 * @param error The error message or object
 */
function setRunFailed (error: string | Error | unknown) {
  let failureMessage = 'An error occurred while running checks'
  if (error instanceof Error) {
    failureMessage = error.message
  } else if (typeof error === 'string') {
    failureMessage = error
  }
  core.setFailed(failureMessage)
}
