import { sendOnboardingRoleWelcomeEmail } from "./src/modules/email/email.service.ts";
import { loadEnv } from "./src/config/env.ts";

async function test() {
  loadEnv();
  console.log("Sending email...");
  try {
    const res = await sendOnboardingRoleWelcomeEmail({
      organizationId: undefined, // platform smtp
      to: "niyam.r@gyroitsolutions.com", // a safe test email, or just dummy
      userName: "Test User",
      organizationName: "Test Org",
      role: "OWNER",
      loginUrl: "http://localhost:3000/login"
    });
    console.log("Result:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
