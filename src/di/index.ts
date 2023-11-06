import { info, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { Context } from '@actions/github/lib/context'
import { Transport, createLogger } from 'nautilustar-debug'
import { Log } from 'nautilustar-debug/dist/Log'
import fetch from 'node-fetch'
import { container, instanceCachingFactory } from 'tsyringe'
import { Client } from '../data/client'
import { VersionControlSystemRepository } from '../data/repository'
import { IsAllChecksCompletedUseCase } from '../domain/IsAllChecksCompleted'
import { IVersionControlSystemRepository } from '../domain/repository'
import { Logger } from '../utils'

class ActionLogTransport implements Transport {
  log (data: Log.Data): void {
    switch (data.level) {
      case Log.Level.ERROR:
        setFailed(data.message)
        break
      case Log.Level.INFO:
        info(data.message)
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
          ],
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
      useValue: context,
    },
  )
  .register<string>(
    'GITHUB_TOKEN',
    {
      useFactory: () => process.env.GITHUB_TOKEN || '',
    },
  )
  .register<Client>(
    'Client',
    {
      useFactory: (container) => {
        const token = container.resolve<string>('GITHUB_TOKEN')

        return getOctokit(token, {
          request: { fetch },
        })
      },
    },
  )
