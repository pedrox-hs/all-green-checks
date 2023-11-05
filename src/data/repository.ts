import * as core from '@actions/core'
import { Context } from '@actions/github/lib/context'
import type { RestEndpointMethods } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types'
import { inject, injectable } from 'tsyringe'
import { CheckRun, Conclusion, Options, Status } from '../domain/entities'
import { IVersionControlSystemRepository } from '../domain/repository'
import { Logger } from '../utils'

@injectable()
export class VersionControlSystemRepository implements IVersionControlSystemRepository {
  private context: Context
  private client: RestEndpointMethods
  private logger: Logger

  constructor (
    context: Context,
    @inject('RestEndpointMethods')
    client: RestEndpointMethods,
    @inject('Logger')
    logger: Logger,
  ) {
    this.context = context
    this.client = client
    this.logger = logger
  }

  async getOptions (): Promise<Options> {
    const checkInterval = core.getInput('interval', { required: true, trimWhitespace: true })
    const ignoredJobs = core.getInput('ignore', { required: true })

    return {
      ignoredJobs: ignoredJobs.split(/(,|\n)/).map((job) => job.trim()),
      checkInterval: parseInt(checkInterval, 10),
    }
  }

  async getCheckRuns (): Promise<CheckRun[]> {
    const ref = core.getInput('ref') || this.context.sha
    const { data: { check_runs: checkRuns } } = await this.client.checks.listForRef({
      ...this.context.repo,
      ref,
      per_page: 100,
    })

    return checkRuns.map((checkRun) => ({
      name: checkRun.name,
      status: checkRun.status as Status,
      conclusion: checkRun.conclusion as Conclusion,
    }))
  }
}
