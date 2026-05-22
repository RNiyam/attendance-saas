const { Pool } = require("pg");
require("dotenv").config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("DROP TABLE IF EXISTS leave_policy_template_items CASCADE;");
    await pool.query("DROP TYPE IF EXISTS accrual_period CASCADE;");
    console.log("Cleaned up accrual_period.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
