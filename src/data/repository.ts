import { getInput } from '@actions/core'
import { Context } from '@actions/github/lib/context'
import { inject, injectable } from 'tsyringe'
import { CheckRun, Conclusion, Options, Status } from '../domain/entities'
import { IVersionControlSystemRepository } from '../domain/repository'
import { Client } from './client'

@injectable()
export class VersionControlSystemRepository implements IVersionControlSystemRepository {
  private context: Context
  private client: Client

  constructor (
    context: Context,
    @inject('Client')
    client: Client,
  ) {
    this.context = context
    this.client = client
  }

  async getOptions (): Promise<Options> {
    const checkInterval = getInput('interval', { required: true, trimWhitespace: true })
    const ignoredJobs = getInput('ignore', { required: true })

    return {
      ignoredJobs: ignoredJobs.split(/(,|\n)/).map((job) => job.trim()),
      checkInterval: parseInt(checkInterval, 10),
    }
  }

  async getCheckRuns (): Promise<CheckRun[]> {
    const ref = getInput('ref') || this.context.sha
    const { data: { check_runs: checkRuns } } = await this.client.rest.checks.listForRef({
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
