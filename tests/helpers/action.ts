import 'reflect-metadata'

import container from '../../src/di'
import * as app from '../../src/gateway'
import { getFixturePath } from './fixtures'
import { DependencyContainer } from 'tsyringe'

export type Path = string

export type Event = {
  id?: string | undefined
  name: string
  payload: Path
}

export async function receive (event: Event, beforeRun?: (container: DependencyContainer) => void) {
  setup(event)
  if (beforeRun) {
    beforeRun(container)
  }
  await app.main(container)
  reset()
}

function setup (event: Event) {
  process.env.GITHUB_TOKEN = 'dummy'
  process.env.GITHUB_REPOSITORY = 'pedrox-hs/all-green-checks'
  process.env.GITHUB_RUN_ID = event.id
  process.env.GITHUB_EVENT_NAME = event.name
  process.env.GITHUB_EVENT_PATH = getFixturePath(event.payload)
}

function reset () {
  delete process.env.GITHUB_TOKEN
  delete process.env.GITHUB_REPOSITORY
  delete process.env.GITHUB_RUN_ID
  delete process.env.GITHUB_EVENT_NAME
  delete process.env.GITHUB_EVENT_PATH
}
