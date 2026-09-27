import { neon } from '@neondatabase/serverless'

/**
 * Pairing API (Vercel function). Two phones share one pair code; each phone
 * uploads its likes, notes, streak and memories and gets the other phone's back.
 *
 * Needs a Postgres database connected in Vercel (DATABASE_URL). Tables are
 * created on first use.
 */

const MAX_MEMBERS = 2
const MAX_BODY = 400_000
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type Kind = 'unavailable' | 'not-found' | 'full' | 'gone' | 'other'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const fail = (status: number, kind: Kind, error: string) => json({ error, kind }, status)

function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL
}

let schemaReady: Promise<unknown> | null = null

function db() {
  const sql = neon(databaseUrl()!)
  schemaReady ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS pairs (
      code text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now()
    )`
    await sql`CREATE TABLE IF NOT EXISTS pair_members (
      code text NOT NULL REFERENCES pairs(code) ON DELETE CASCADE,
      device_id text NOT NULL,
      name text NOT NULL,
      data jsonb,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (code, device_id)
    )`
  })().catch((e) => {
    schemaReady = null
    throw e
  })
  return { sql, ready: schemaReady }
}

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

const isCode = (v: unknown): v is string => typeof v === 'string' && /^[A-Z0-9]{6}$/.test(v)
const isDevice = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(v)
const cleanName = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 30) : '') || 'Partner'

export function GET() {
  return json({ ready: !!databaseUrl() })
}

export async function POST(request: Request) {
  if (!databaseUrl()) {
    return fail(503, 'unavailable', 'Pairing needs a database. Connect one in Vercel under Storage.')
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY) return fail(413, 'other', 'Too much data to sync.')
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return fail(400, 'other', 'Bad request.')
  }

  const { action, code, deviceId } = body
  if (!isDevice(deviceId)) return fail(400, 'other', 'Bad request.')

  const { sql, ready } = db()
  try {
    await ready

    if (action === 'create') {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = newCode()
        const rows = await sql`INSERT INTO pairs (code) VALUES (${candidate}) ON CONFLICT DO NOTHING RETURNING code`
        if (rows.length === 0) continue
        await sql`INSERT INTO pair_members (code, device_id, name) VALUES (${candidate}, ${deviceId}, ${cleanName(body.name)})`
        return json({ code: candidate })
      }
      return fail(500, 'other', "Couldn't create a code. Try again.")
    }

    if (!isCode(code)) return fail(400, 'not-found', 'That code is not valid. Codes have 6 letters and numbers.')

    if (action === 'join') {
      const pair = await sql`SELECT code FROM pairs WHERE code = ${code}`
      if (pair.length === 0) return fail(404, 'not-found', 'No pair found with that code.')
      const members = await sql`SELECT device_id FROM pair_members WHERE code = ${code}`
      const already = members.some((m) => m.device_id === deviceId)
      if (!already && members.length >= MAX_MEMBERS) return fail(409, 'full', 'That code already has two phones.')
      await sql`INSERT INTO pair_members (code, device_id, name) VALUES (${code}, ${deviceId}, ${cleanName(body.name)})
        ON CONFLICT (code, device_id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`
      return json({ code })
    }

    if (action === 'sync') {
      const data = typeof body.data === 'object' && body.data ? JSON.stringify(body.data) : null
      const updated = await sql`UPDATE pair_members SET name = ${cleanName(body.name)}, data = ${data}::jsonb, updated_at = now()
        WHERE code = ${code} AND device_id = ${deviceId} RETURNING code`
      if (updated.length === 0) return fail(410, 'gone', 'This phone is no longer paired.')
      const others = await sql`SELECT name, data, updated_at FROM pair_members WHERE code = ${code} AND device_id <> ${deviceId}`
      return json({
        members: others.map((m) => ({ name: m.name, data: m.data, updatedAt: new Date(m.updated_at).getTime() })),
      })
    }

    if (action === 'leave') {
      await sql`DELETE FROM pair_members WHERE code = ${code} AND device_id = ${deviceId}`
      await sql`DELETE FROM pairs WHERE code = ${code} AND NOT EXISTS (SELECT 1 FROM pair_members WHERE code = ${code})`
      return json({ ok: true })
    }

    return fail(400, 'other', 'Unknown action.')
  } catch (e) {
    console.error('pair api error', e)
    return fail(500, 'other', 'The server had a problem. Try again in a moment.')
  }
}
