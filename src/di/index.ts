import * as core from '@actions/core'
import * as github from '@actions/github'
import { Context } from '@actions/github/lib/context'
import { ConsoleTransport, StyledConsoleFormatter, Transport, createLogger } from 'nautilustar-debug'
import { Log } from 'nautilustar-debug/dist/Log'
import { container, instanceCachingFactory } from 'tsyringe'
import { VersionControlSystemRepository } from '../data/repository'
import { IsAllChecksCompletedUseCase } from '../domain/IsAllChecksCompleted'
import { IVersionControlSystemRepository } from '../domain/repository'
import { Logger } from '../utils'
import { RestEndpointMethods } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types'
import fetch from 'node-fetch'

class ActionLogTransport implements Transport {
  log (data: Log.Data): void {
    switch (data.level) {
      case Log.Level.ERROR:
        core.setFailed(data.message)
        break
      case Log.Level.INFO:
        core.info(data.message)
        break
    }
  }
}

export default container
  .register<Logger>(
    'Logger',
    {
      useFactory: instanceCachingFactory<Logger>(
        () => createLogger({
          transporters: [
            new ActionLogTransport(),
            new ConsoleTransport({
              formatter: new StyledConsoleFormatter(),
            }),
          ].slice(0, 1),
        }),
      ),
    },
  )
  .register<IVersionControlSystemRepository>(
    'IVersionControlSystemRepository',
    {
      useClass: VersionControlSystemRepository,
    },
  )
  .register<IsAllChecksCompletedUseCase>(
    'IsAllChecksCompletedUseCase',
    {
      useClass: IsAllChecksCompletedUseCase,
    },
  )
  .register<Context>(
    'Context',
    {
      useValue: github.context,
    },
  )
  .register<RestEndpointMethods>(
    'RestEndpointMethods',
    {
      useFactory: (container) => {
        const token = container.resolve<string>('GITHUB_TOKEN')

        return github.getOctokit(token, {
          request: { fetch },
        }).rest
      },
    },
  )
