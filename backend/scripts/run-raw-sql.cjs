const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sqlPath = path.join(__dirname, '../drizzle/0003_cuddly_starjammers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by statement-breakpoint if needed, or just run the whole thing
    const statements = sql.split('--> statement-breakpoint');
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await pool.query(stmt.trim());
      }
    }
    console.log("Successfully ran the data type alter script!");
    
    // Now drop all the pg enums since they are no longer needed
    const dropTypes = [
      "org_status", "user_status", "employee_status", "gender", "employment_type",
      "billing_cycle", "work_unit", "address_type", "assignment_type", "shift_type",
      "break_category", "pay_type", "break_rule_type", "attendance_status", "attendance_source",
      "attendance_event_type", "policy_cycle", "accrual_period", "approver_type",
      "leave_request_status", "leave_decision", "component_type", "payroll_cycle_status",
      "payroll_run_status", "adjustment_type", "payslip_status", "integration_status",
      "webhook_status", "platform_admin_status", "invite_status"
    ];
    for (const type of dropTypes) {
      try {
        await pool.query(`DROP TYPE IF EXISTS ${type} CASCADE;`);
      } catch (e) {
        console.warn(`Could not drop ${type}: ${e.message}`);
      }
    }
    console.log("Cleaned up old pg enums.");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
