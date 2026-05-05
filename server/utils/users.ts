import bcrypt from 'bcryptjs'

interface StoredUser {
  username: string
  passwordHash: string
}

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(process.env.AUTH_USERS || '[]') as StoredUser[]
  } catch {
    return []
  }
}

export async function validateUser(username: string, password: string): Promise<boolean> {
  const users = getUsers()
  const user = users.find((u) => u.username === username)
  if (!user) return false
  return bcrypt.compare(password, user.passwordHash)
}

export function userExists(username: string): boolean {
  return getUsers().some((u) => u.username === username)
}
