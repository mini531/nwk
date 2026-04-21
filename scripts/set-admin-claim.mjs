#!/usr/bin/env node
// Grants or revokes the `admin: true` custom claim on a Firebase Auth user.
// The app's Firestore rules gate course + note moderation writes on this claim,
// so this is the canonical way to bootstrap the first admin account before
// the UI has any "promote user" flow.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//     node scripts/set-admin-claim.mjs <uid|email>
//   node scripts/set-admin-claim.mjs <uid|email> --revoke
//
// The user must sign out and back in (or refresh their ID token) before the
// new claim takes effect on the client.

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FUNCTIONS_DIR = resolve(__dirname, '..', 'functions')
// Re-use firebase-admin from functions/node_modules so the web app doesn't
// need its own dependency. The functions package already ships it.
const require = createRequire(resolve(FUNCTIONS_DIR, 'package.json'))
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const args = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('-')))
const revoke = flags.has('--revoke')

if (args.length !== 1) {
  console.error('Usage: node scripts/set-admin-claim.mjs <uid|email> [--revoke]')
  process.exit(1)
}
const target = args[0]

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const projectId = process.env.FIREBASE_PROJECT_ID || 'nwk-app-ba6f8'

let credential
if (saPath) {
  const sa = require(resolve(process.cwd(), saPath))
  credential = cert(sa)
} else {
  try {
    credential = applicationDefault()
  } catch {
    console.error(
      'No credentials. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON, ' +
        'or run `gcloud auth application-default login` first.',
    )
    process.exit(1)
  }
}

initializeApp({ credential, projectId })
const auth = getAuth()

const resolveUid = async (idOrEmail) => {
  if (idOrEmail.includes('@')) {
    const rec = await auth.getUserByEmail(idOrEmail)
    return rec.uid
  }
  const rec = await auth.getUser(idOrEmail)
  return rec.uid
}

try {
  const uid = await resolveUid(target)
  const current = (await auth.getUser(uid)).customClaims || {}
  const next = { ...current }
  if (revoke) delete next.admin
  else next.admin = true
  await auth.setCustomUserClaims(uid, next)
  console.log(
    revoke
      ? `Revoked admin claim for ${uid}.`
      : `Granted admin claim for ${uid}. User must re-login for the token to refresh.`,
  )
  console.log('Current claims:', next)
  process.exit(0)
} catch (err) {
  console.error('Failed:', err.message || err)
  process.exit(1)
}
