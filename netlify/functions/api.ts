import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Serverless function handler for Netlify (/api/* -> /.netlify/functions/api)
// Uses /tmp/store-db.json in serverless environments so writes succeed during warm instances.
const TMP_DB_FILE = path.join('/tmp', 'zain-store-db.json');
const REPO_DB_FILE = path.resolve(process.cwd(), 'data', 'store-db.json');

function loadServerlessDb() {
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_DB_FILE, 'utf-8'));
    }
    if (fs.existsSync(REPO_DB_FILE)) {
      const initial = fs.readFileSync(REPO_DB_FILE, 'utf-8');
      fs.writeFileSync(TMP_DB_FILE, initial, 'utf-8');
      return JSON.parse(initial);
    }
  } catch {
    // Fallback handled by client localStoreEngine if needed
  }
  return null;
}

function saveServerlessDb(db: unknown) {
  try {
    fs.writeFileSync(TMP_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Ignore read-only fs errors
  }
}

export const handler = async (event: {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
}) => {
  const db = loadServerlessDb();
  if (!db) {
    // Return 404 so client-side localStoreEngine fallback handles it seamlessly
    return { statusCode: 404, body: JSON.stringify({ error: 'Use local engine' }) };
  }

  const rawPath = event.path.replace('/.netlify/functions/api', '/api');
  const method = (event.httpMethod || 'GET').toUpperCase();
  const body = event.body ? JSON.parse(event.body) : {};
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const session = (db.sessions || []).find((s: { token: string }) => s.token === token);
  const user = session
    ? (db.users || []).find((u: { id: string }) => u.id === session.userId) || null
    : null;

  const json = (statusCode: number, data: unknown) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (rawPath === '/api/bootstrap' && method === 'GET') {
    return json(200, {
      categories: db.categories,
      products: db.products,
      settings: db.settings,
      activeCoupons: (db.coupons || []).filter((c: { isActive: boolean }) => c.isActive),
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            defaultAddress: user.defaultAddress,
            role: user.role,
            createdAt: user.createdAt,
          }
        : null,
    });
  }

  if (rawPath === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const found = (db.users || []).find(
      (u: { email: string }) => u.email.toLowerCase() === email
    );
    if (!found) return json(401, { error: 'Invalid email or password.' });
    const computed = crypto
      .scryptSync(String(body.password || ''), found.salt, 64)
      .toString('hex');
    if (computed !== found.passwordHash) {
      return json(401, { error: 'Invalid email or password.' });
    }
    const newToken = crypto.randomBytes(24).toString('hex');
    db.sessions = db.sessions || [];
    db.sessions.push({ token: newToken, userId: found.id, createdAt: new Date().toISOString() });
    saveServerlessDb(db);
    return json(200, {
      token: newToken,
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        defaultAddress: found.defaultAddress,
        role: found.role,
        createdAt: found.createdAt,
      },
    });
  }

  // Delegate remaining routes to client-side persistent engine on static/serverless
  return { statusCode: 404, body: JSON.stringify({ fallback: true }) };
};
