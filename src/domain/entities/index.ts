// export type Repo = {
//   owner: string
//   name: string
// }

// export type Ref = string

export type Duration = number

export type Job = string

export enum Status {
  Completed = 'completed',
  InProgress = 'in_progress',
  Queued = 'queued',
}

export enum Conclusion {
  ActionRequired = 'action_required',
  Cancelled = 'cancelled',
  Failure = 'failure',
  Neutral = 'neutral',
  Success = 'success',
  Skipped = 'skipped',
  Stale = 'stale',
  TimedOut = 'timed_out',
}

export type CheckRun = {
  name: Job
  status: Status
  conclusion: Conclusion | null
}

export type Options = {
  // checksRef: Ref
  checkInterval: Duration
  ignoredJobs: Job[]
}
