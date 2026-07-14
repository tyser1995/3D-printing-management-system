import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_SESSION_COOKIE = 'kai3d_admin_session'
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || ''
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createAdminSessionToken(): string {
  const payload = `admin:${Date.now() + ADMIN_SESSION_MAX_AGE * 1000}`
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url')
  return `${encodedPayload}.${sign(payload)}`
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || !getSecret()) return false

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8')
  const expectedSignature = sign(payload)

  const signatureBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSignature)
  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
    return false
  }

  const expiresAt = Number(payload.split(':')[1])
  return Number.isFinite(expiresAt) && Date.now() < expiresAt
}
