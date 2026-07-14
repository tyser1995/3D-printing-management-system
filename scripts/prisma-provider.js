// Prisma's datasource `provider` is a static string baked in at `prisma generate`
// time — only `url` can come from an env var. This app runs SQLite locally
// (`DATABASE_URL="file:..."`) and Postgres in production (Supabase), so the schema's
// provider has to be rewritten to match DATABASE_URL before each generate, otherwise
// the generated client only works with whichever dialect was set last.
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const databaseUrl = process.env.DATABASE_URL ?? ''

function isValidPostgresUrl(url) {
  if (!url || !URL.canParse(url)) return false
  const protocol = new URL(url).protocol
  return protocol === 'postgres:' || protocol === 'postgresql:'
}

// file: URL -> sqlite. Valid postgres(ql):// URL -> postgresql. Anything else (missing,
// blank, or a placeholder like "your_supabase_connection_string") -> sqlite, matching
// lib/prisma/client.ts's runtime fallback to the bundled demo dataset.
const provider = isValidPostgresUrl(databaseUrl) ? 'postgresql' : 'sqlite'

const schema = fs.readFileSync(schemaPath, 'utf8')
const updated = schema.replace(/(datasource db \{\s*provider = )"[^"]+"/, `$1"${provider}"`)
fs.writeFileSync(schemaPath, updated)

execSync('npx prisma generate', { stdio: 'inherit' })
