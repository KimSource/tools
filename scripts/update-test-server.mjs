/* global process */

import { cp, mkdir, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const fixtures = join(root, '.tmp', 'pwa-update')
const port = 3002
let version = 'a'

function runBuild(buildVersion) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'build'],
      {
        cwd: root,
        env: { ...process.env, VITE_UPDATE_TEST_VERSION: buildVersion },
        stdio: 'inherit',
        shell: process.platform === 'win32',
      },
    )
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`)),
    )
  })
}

async function prepareFixtures() {
  await rm(fixtures, { recursive: true, force: true })
  await mkdir(fixtures, { recursive: true })
  for (const buildVersion of ['a', 'b']) {
    await runBuild(buildVersion)
    await cp(join(root, 'dist'), join(fixtures, buildVersion), {
      recursive: true,
    })
  }
}

function serveFile(request, response) {
  const requestPath = new URL(request.url, 'http://localhost').pathname
  const relative = requestPath.replace(/^\/tools\/?/, '') || 'index.html'
  const file = join(fixtures, version, relative)
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
  }
  response.setHeader(
    'Content-Type',
    contentTypes[relative.slice(relative.lastIndexOf('.'))] ??
      'application/octet-stream',
  )
  import('node:fs').then(({ createReadStream, statSync }) => {
    try {
      const stat = statSync(file)
      if (!stat.isFile()) throw new Error('not a file')
      createReadStream(file).pipe(response)
    } catch {
      response.statusCode = 404
      response.end('Not found')
    }
  })
}

await prepareFixtures()
createServer((request, response) => {
  if (request.url === '/__e2e/switch-to-b') {
    version = 'b'
    response.end('ok')
    return
  }
  serveFile(request, response)
}).listen(port, '127.0.0.1', () =>
  console.log(`Update test server listening on ${port}`),
)
