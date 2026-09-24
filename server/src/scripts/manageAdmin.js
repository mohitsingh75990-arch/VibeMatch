#!/usr/bin/env node

/**
 * Server-side Admin Role Management Utility
 * 
 * Usage:
 *   node src/scripts/manageAdmin.js <email> [--revoke]
 * 
 * Example:
 *   node src/scripts/manageAdmin.js admin@vibematch.com
 *   node src/scripts/manageAdmin.js admin@vibematch.com --revoke
 */

const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const User = require('../models/User')

async function run() {
  const args = process.argv.slice(2)
  const isRevoke = args.includes('--revoke')
  const emailArg = args.find((a) => !a.startsWith('--'))

  if (!emailArg) {
    console.error('Error: Please provide an email address.')
    console.log('Usage: node src/scripts/manageAdmin.js <email> [--revoke]')
    process.exit(1)
  }

  const normalizedEmail = emailArg.trim().toLowerCase()

  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not defined.')
    process.exit(1)
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI)

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      console.error(
        `Error: User "${normalizedEmail}" not found in database.\nThe user must first create an account through VibeMatch before receiving administrator privileges.`,
      )
      await mongoose.disconnect()
      process.exit(1)
    }

    if (isRevoke) {
      user.isAdmin = false
      await user.save()
      console.log(
        `[SUCCESS] Administrator privileges REVOKED for user: ${user.name} (${user.email})`,
      )
    } else {
      user.isAdmin = true
      user.isEmailVerified = true
      await user.save()
      console.log(
        `[SUCCESS] Administrator privileges GRANTED to user: ${user.name} (${user.email}) [verified: true]`,
      )
    }

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Database error:', error.message)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
    process.exit(1)
  }
}

run()
