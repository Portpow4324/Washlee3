#!/usr/bin/env node

import crypto from 'node:crypto'
import readline from 'node:readline'
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

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

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function verifySecret(secret, configuredHash) {
  const [algorithm, iterationsValue, saltHex, expectedHash] = configuredHash.split('$')
  const iterations = Number(iterationsValue)

  if (
    algorithm !== 'pbkdf2_sha256' ||
    !Number.isInteger(iterations) ||
    iterations < 100000 ||
    !/^[a-f0-9]+$/i.test(saltHex || '') ||
    !/^[a-f0-9]+$/i.test(expectedHash || '')
  ) {
    return false
  }

  const actualHash = crypto
    .pbkdf2Sync(secret.trim(), Buffer.from(saltHex, 'hex'), iterations, 32, 'sha256')
    .toString('hex')

  return timingSafeEqual(actualHash, expectedHash)
}

const requested = process.argv[2]
const indexes = requested ? [requested.replace(/^ADMIN_RECOVERY_ANSWER_HASH_/, '')] : ['1', '2', '3']

for (const index of indexes) {
  const question = process.env[`ADMIN_RECOVERY_QUESTION_${index}`] || `Recovery question ${index}`
  const hash = process.env[`ADMIN_RECOVERY_ANSWER_HASH_${index}`] || ''

  if (!hash) {
    console.log(`Question ${index}: not configured`)
    continue
  }

  console.log(`\nQuestion ${index}: ${question}`)
  const answer = await askHidden(`Answer ${index}: `)
  const matches = verifySecret(answer, hash)
  console.log(matches ? `Question ${index}: MATCH` : `Question ${index}: NO MATCH`)
}
