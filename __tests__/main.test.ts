import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as installer from '../src/installer'
import * as githubApiHelper from '../src/github-api-helper'
import * as tc from '@actions/tool-cache'
import * as os from 'os'
import * as path from 'path'
import {describe, expect, jest, test, beforeEach} from '@jest/globals'

// Mock child_process BEFORE importing main.ts so that util.promisify(exec) at
// module-load time picks up our mock. We attach the custom promisify symbol so
// the promisified function resolves to {stdout, stderr} correctly.
jest.mock('child_process', () => {
  const customPromisifySymbol = Symbol.for('nodejs.util.promisify.custom')
  const execMock = jest.fn()
  // util.promisify checks for this symbol and uses it directly as the
  // promisified implementation, so we set it to an arrow function.
  ;(execMock as unknown as Record<symbol, unknown>)[customPromisifySymbol] = (
    _cmd: string
  ): Promise<{stdout: string; stderr: string}> =>
    Promise.resolve({stdout: 'V 0.4.4 abc123', stderr: ''})
  return {exec: execMock}
})

jest.mock('@actions/cache')
jest.mock('@actions/core')
jest.mock('@actions/tool-cache')
jest.mock('../src/installer')
jest.mock('../src/github-api-helper')
// IS_POST: true → cleanup() is called instead of run() on module load (no-op)
jest.mock('../src/state-helper', () => ({IS_POST: true}))

import {run} from '../src/main'

const mockInstallDir = path.join(os.homedir(), 'vlang', `vlang_${os.platform()}_x64`)

function mockInputs(overrides: Record<string, string> = {}): void {
  const defaults: Record<string, string> = {
    token: 'fake-token',
    version: '0.4.4',
    'version-file': '',
    'check-latest': 'false',
    stable: 'false',
    architecture: 'x64',
    cache: 'true'
  }
  const inputs = {...defaults, ...overrides}
  jest.mocked(core.getInput).mockImplementation((name: string) => inputs[name] ?? '')
}

describe('run() — caching behaviour', () => {
  beforeEach(() => {
    mockInputs()
    jest.mocked(installer.getInstallDir).mockReturnValue(mockInstallDir)
    jest.mocked(installer.translateArchToDistUrl).mockReturnValue('x64')
    jest.mocked(installer.getVlang).mockResolvedValue(mockInstallDir)
    jest.mocked(tc.cacheDir).mockResolvedValue('/tool-cache/v/0.4.4')
  })

  test('pinned version: cache hit — skips installer, no API calls', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue('setup-v-linux-x64-0.4.4')

    await run()

    expect(cache.restoreCache).toHaveBeenCalledWith(
      [mockInstallDir],
      expect.stringMatching(/setup-v-.*-x64-0\.4\.4/)
    )
    expect(githubApiHelper.getLatestRelease).not.toHaveBeenCalled()
    expect(installer.getVlang).not.toHaveBeenCalled()
    expect(cache.saveCache).not.toHaveBeenCalled()
    expect(core.addPath).toHaveBeenCalledWith('/tool-cache/v/0.4.4')
    expect(core.setOutput).toHaveBeenCalledWith('version', '0.4.4')
  })

  test('pinned version: cache miss — installs v and saves to cache', async () => {
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)

    await run()

    expect(cache.restoreCache).toHaveBeenCalled()
    expect(installer.getVlang).toHaveBeenCalledWith(
      expect.objectContaining({resolvedRef: '0.4.4'})
    )
    expect(cache.saveCache).toHaveBeenCalledWith(
      [mockInstallDir],
      expect.stringMatching(/setup-v-.*-x64-0\.4\.4/)
    )
    expect(core.addPath).toHaveBeenCalledWith('/tool-cache/v/0.4.4')
  })

  test('check-latest + stable: cache hit — skips API call and installer', async () => {
    mockInputs({'check-latest': 'true', stable: 'true', version: ''})
    jest.mocked(cache.restoreCache).mockResolvedValue('setup-v-linux-x64-stable')

    await run()

    // Cache key must use the fixed "stable" suffix, not a resolved version
    expect(cache.restoreCache).toHaveBeenCalledWith(
      [mockInstallDir],
      expect.stringMatching(/setup-v-.*-x64-stable$/)
    )
    // No API call should have been made
    expect(githubApiHelper.getLatestRelease).not.toHaveBeenCalled()
    expect(installer.getVlang).not.toHaveBeenCalled()
    expect(cache.saveCache).not.toHaveBeenCalled()
  })

  test('check-latest + stable: cache miss — calls API then installs', async () => {
    mockInputs({'check-latest': 'true', stable: 'true', version: ''})
    jest.mocked(cache.restoreCache).mockResolvedValue(undefined)
    jest.mocked(githubApiHelper.getLatestRelease).mockResolvedValue('0.4.4')

    await run()

    expect(cache.restoreCache).toHaveBeenCalledWith(
      [mockInstallDir],
      expect.stringMatching(/setup-v-.*-x64-stable$/)
    )
    // API call fires only after the cache miss
    expect(githubApiHelper.getLatestRelease).toHaveBeenCalled()
    expect(installer.getVlang).toHaveBeenCalledWith(
      expect.objectContaining({resolvedRef: '0.4.4'})
    )
    expect(cache.saveCache).toHaveBeenCalledWith(
      [mockInstallDir],
      expect.stringMatching(/setup-v-.*-x64-stable$/)
    )
  })

  test('cache: false — skips restoreCache and saveCache', async () => {
    mockInputs({cache: 'false'})

    await run()

    expect(cache.restoreCache).not.toHaveBeenCalled()
    expect(installer.getVlang).toHaveBeenCalled()
    expect(cache.saveCache).not.toHaveBeenCalled()
  })

  test('HEAD build (check-latest, not stable) — no caching, no API call', async () => {
    mockInputs({'check-latest': 'true', stable: 'false', version: ''})

    await run()

    expect(cache.restoreCache).not.toHaveBeenCalled()
    expect(githubApiHelper.getLatestRelease).not.toHaveBeenCalled()
    expect(installer.getVlang).toHaveBeenCalledWith(
      expect.objectContaining({resolvedRef: undefined})
    )
    expect(cache.saveCache).not.toHaveBeenCalled()
  })
})
