const crypto = require('crypto')

const getEncryptionKey = () => {
  const key = process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY

  if (!key) {
    return null
  }

  const keyBuffer = Buffer.from(key, 'hex')

  if (keyBuffer.length !== 32) {
    throw new Error('SPOTIFY_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
  }

  return keyBuffer
}

const encrypt = (plaintext) => {
  if (!plaintext) {
    return null
  }

  const key = getEncryptionKey()

  if (!key) {
    throw new Error('Token encryption key not configured')
  }

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return {
    encrypted: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

const decrypt = (encryptedData) => {
  if (!encryptedData || !encryptedData.encrypted) {
    return null
  }

  const key = getEncryptionKey()

  if (!key) {
    throw new Error('Token encryption key not configured')
  }

  try {
    const iv = Buffer.from(encryptedData.iv, 'base64')
    const authTag = Buffer.from(encryptedData.authTag, 'base64')
    const ciphertext = Buffer.from(encryptedData.encrypted, 'base64')

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return plaintext.toString('utf8')
  } catch (error) {
    console.error('Token decryption failed:', error.message)
    return null
  }
}

const isEncryptedFormat = (value) => {
  return value && typeof value === 'object' && 'encrypted' in value && 'iv' in value && 'authTag' in value
}

const migratePlaintextIfNeeded = (value) => {
  if (!value) {
    return null
  }

  if (isEncryptedFormat(value)) {
    return value
  }

  if (typeof value === 'string') {
    return encrypt(value)
  }

  return null
}

module.exports = {
  encrypt,
  decrypt,
  isEncryptedFormat,
  migratePlaintextIfNeeded,
  getEncryptionKey,
}