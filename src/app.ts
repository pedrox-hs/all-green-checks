import { PullRequestEvent, PushEvent } from '@octokit/webhooks-types'
import { Context, Probot } from 'probot'
import { runAllGreenAction } from './action'

export default function (app: Probot) {
  app.on('push', onPush)
  app.on('pull_request', onPuRequest)
}

export async function onPush (context: Context) {
  const payload = context.payload as PushEvent
  await runAllGreenAction(
    context,
    payload.repository,
    payload.head_commit!.id,
  )
}

export async function onPuRequest (context: Context) {
  const payload = context.payload as PullRequestEvent
  await runAllGreenAction(
    context,
    payload.repository,
    payload.pull_request.head.sha,
  )
}
