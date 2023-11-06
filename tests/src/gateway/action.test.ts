import * as core from '@actions/core'
import nock from 'nock'
import * as action from '../../helpers/action'
import { getFixture } from '../../helpers/fixtures'
import { fakeSetTimeout } from '../../helpers/timer'

describe('all-green-checks', () => {
  let setFailedMock: jest.SpyInstance

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  beforeEach(() => {
    jest.spyOn(core, 'info').mockImplementation()
    jest.spyOn(global, 'setTimeout').mockImplementation(fakeSetTimeout)
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()

    process.env.GITHUB_TOKEN = 'dummy'
    process.env.GITHUB_SHA = 'd66adf86fb244c1511ed4ebbb8710dfab0f6ae1a'
    process.env.INPUT_IGNORE = 'alls-green-check'
    process.env.INPUT_INTERVAL = '5'
  })

  afterEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
    delete process.env.GITHUB_TOKEN
    delete process.env.GITHUB_SHA
    delete process.env.INPUT_REF
    delete process.env.INPUT_IGNORE
    delete process.env.INPUT_INTERVAL
  })

  it('should setFailed when has not github token', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    delete process.env.GITHUB_TOKEN

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).toHaveBeenCalledWith(expect.stringContaining('The `GITHUB_TOKEN` must be set'))
  })

  it('should setFailed when check-interval is not a number', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    process.env.INPUT_INTERVAL = 'not a number'

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).toHaveBeenCalledWith(expect.stringContaining('The `check-interval` must be a number'))
  })

  it('should setFailed when check-interval is not a positive number', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    process.env.INPUT_INTERVAL = '0'

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).toHaveBeenCalledWith(expect.stringContaining('The `check-interval` must be positive'))
  })

  it('should wait jobs to complete', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    const checksInProgress = getFixture('check_runs.in_progress.json')
    const checksCompleted = getFixture('check_runs.completed.success.json')
    process.env.INPUT_REF = 'd66adf86fb244c1511ed4ebbb8710dfab0f6ae1a'

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/d66adf86fb244c1511ed4ebbb8710dfab0f6ae1a/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksInProgress, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/d66adf86fb244c1511ed4ebbb8710dfab0f6ae1a/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksCompleted, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000)
    expect(nock.isDone()).toBe(true)
  })

  it('should ignore jobs from list', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    const checksFailure = getFixture('check_runs.completed.failure.json')
    process.env.INPUT_IGNORE = 'alls-green-check,Unit tests'

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/d66adf86fb244c1511ed4ebbb8710dfab0f6ae1a/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksFailure, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).not.toHaveBeenCalledWith()
    expect(nock.isDone()).toBe(true)
  })

  it('should fail when has any job failure', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    const checksFailure = getFixture('check_runs.completed.failure.json')

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/d66adf86fb244c1511ed4ebbb8710dfab0f6ae1a/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksFailure, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).toHaveBeenCalledWith(expect.stringContaining('Not all checks are successful'))
    expect(nock.isDone()).toBe(true)
  })

  it('should get ref from input', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    const checksCompleted = getFixture('check_runs.completed.success.json')
    process.env.INPUT_REF = 'b26ee87e782e47bf20ca4731437dd62beb27b142'

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/b26ee87e782e47bf20ca4731437dd62beb27b142/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksCompleted, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(nock.isDone()).toBe(true)
  })

  it('should get ref from env', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    const checksCompleted = getFixture('check_runs.completed.success.json')
    process.env.GITHUB_SHA = 'cb581c31907eac7f62cbefe367aa7ab3075ee925'

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/cb581c31907eac7f62cbefe367aa7ab3075ee925/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksCompleted, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(nock.isDone()).toBe(true)
  })

  it('should success when all jobs are successful completed', async () => {
    // Arrange
    const payload = 'pull_request.opened.json'
    const checksPayload = getFixture('check_runs.completed.success.json')

    nock('https://api.github.com/')
      .get('/repos/pedrox-hs/all-green-checks/commits/d66adf86fb244c1511ed4ebbb8710dfab0f6ae1a/check-runs')
      .query({ per_page: '100' })
      .reply(200, checksPayload, {
        'Content-Type': 'application/json; charset=utf-8',
      })

    // Act
    await action.receive({ name: 'pull_request', payload })

    // Assert
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(nock.isDone()).toBe(true)
  })
})
