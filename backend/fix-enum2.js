const { Pool } = require("pg");
require("dotenv").config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE accrual_period AS ENUM ('all_at_once', 'monthly', 'quarterly', 'na');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("Successfully recreated accrual_period enum.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
