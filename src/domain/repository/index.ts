import { CheckRun, Options } from '../entities'

export interface IVersionControlSystemRepository {
  getOptions(): Promise<Options>
  getCheckRuns(): Promise<CheckRun[]>
}
