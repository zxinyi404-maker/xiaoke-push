const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function saveSubscription(subscription) {
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      subscription JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`DELETE FROM subscriptions`;
  await sql`INSERT INTO subscriptions (subscription) VALUES (${JSON.stringify(subscription)})`;
}

async function getSubscription() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      subscription JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  const rows = await sql`SELECT subscription FROM subscriptions LIMIT 1`;
  return rows.length > 0 ? rows[0].subscription : null;
}

module.exports = { saveSubscription, getSubscription };
