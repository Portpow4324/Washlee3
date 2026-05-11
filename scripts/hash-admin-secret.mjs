#!/usr/bin/env node

import crypto from 'node:crypto'
import readline from 'node:readline'

function askHidden(question) {
  return new Promise((resolve) => {
    const input = process.stdin
    const output = process.stdout
    const rl = readline.createInterface({ input, output })

    output.write(question)
    input.setRawMode?.(true)
    input.resume()

    let value = ''
    const finish = () => {
      input.setRawMode?.(false)
      input.off('data', onData)
      output.write('\n')
      rl.close()
      resolve(value)
    }

    const onData = (chunk) => {
      const text = chunk.toString('utf8')

      for (const char of text) {
        if (char === '\r' || char === '\n') {
          finish()
          return
        }

        if (char === '\u0003') {
          process.exit(130)
        }

        if (char === '\b' || char === '\u007f') {
          value = value.slice(0, -1)
          return
        }

        value += char
        output.write('*')
      }
    }

    input.on('data', onData)
  })
}

function hashSecret(secret) {
  const salt = crypto.randomBytes(16)
  const iterations = 310000
  const hash = crypto.pbkdf2Sync(secret.trim(), salt, iterations, 32, 'sha256').toString('hex')

  return `pbkdf2_sha256$${iterations}$${salt.toString('hex')}$${hash}`
}

function escapeForEnv(value) {
  return value.replaceAll('$', '\\$')
}

const label = process.argv[2] || 'ADMIN_SECRET_HASH'
const secret = await askHidden(`Enter secret for ${label}: `)

if (!secret.trim()) {
  console.error('No secret entered.')
  process.exit(1)
}

console.log(`\n${label}=${escapeForEnv(hashSecret(secret))}`)
