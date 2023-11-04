import * as core from '@actions/core'
import * as app from '../../src/app'
import nock from 'nock'
import { Probot, ProbotOctokit } from 'probot'
import pullRequestOpened from '../fixtures/pull_request.opened.json'

describe('all-green-checks', () => {
  let getInputMock: jest.SpyInstance
  let setFailedMock: jest.SpyInstance
  let probot: Probot

  beforeEach(() => {
    nock.disableNetConnect()

    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'check-interval':
          return '5'
        case 'job-name':
          return 'alls-green-checks'
        default:
          throw new Error(`Unknown input ${name}`)
      }
    })

    probot = new Probot({
      githubToken: 'test',
      // Disable throttling & retrying requests for easier testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    })
    app.default(probot)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    jest.clearAllMocks()
  })

  describe('on pull_request', () => {
    it('should setFailed when check-interval is not a number', async () => {
    // Arrange
      getInputMock.mockImplementation(() => 'not a number')

      // Act
      // @ts-ignore
      await probot.receive({ name: 'pull_request', payload: pullRequestOpened })

      // Assert
      expect(setFailedMock).toHaveBeenCalledWith('The `check-interval` must be a number')
    })

    it('should setFailed when check-interval is not a positive number', async () => {
    // Arrange
      getInputMock.mockImplementation(() => '0')

      // Act
      // @ts-ignore
      await probot.receive({ name: 'pull_request', payload: pullRequestOpened })

      // Assert
      expect(setFailedMock).toHaveBeenCalledWith('The `check-interval` must be positive')
    })
  })
})
