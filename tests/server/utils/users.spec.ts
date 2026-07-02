import { describe, it, expect, beforeEach } from 'vitest'
import { validateUser, userExists } from '../../../server/utils/users'
import bcrypt from 'bcryptjs'

describe('users utils', () => {
  const testUsername = 'testuser'
  const testPassword = 'password123'
  let passwordHash: string

  beforeEach(async () => {
    passwordHash = await bcrypt.hash(testPassword, 1)
    // Mock AUTH_USERS env var
    process.env.AUTH_USERS = JSON.stringify([
      { username: testUsername, passwordHash }
    ])
  })

  describe('validateUser', () => {
    it('returns true for correct credentials', async () => {
      const isValid = await validateUser(testUsername, testPassword)
      expect(isValid).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const isValid = await validateUser(testUsername, 'wrongpassword')
      expect(isValid).toBe(false)
    })

    it('returns false for nonexistent user', async () => {
      const isValid = await validateUser('nonexistent', testPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('userExists', () => {
    it('returns true if user exists', () => {
      expect(userExists(testUsername)).toBe(true)
    })

    it('returns false if user does not exist', () => {
      expect(userExists('nobody')).toBe(false)
    })
  })
})
