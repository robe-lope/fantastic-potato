import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.APP_ACCESS_PASSWORD || 'fallback-secret-change-me',
);

const TOKEN_COOKIE = 'auth_token';
const TOKEN_EXPIRY = '30d';

export { TOKEN_COOKIE };

export async function createToken(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  const appPassword = process.env.APP_ACCESS_PASSWORD;
  if (!appPassword) return false;
  return password === appPassword;
}
