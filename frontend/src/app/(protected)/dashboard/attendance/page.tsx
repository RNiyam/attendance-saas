import { DataTable } from "@/components/shared/data-table";

export default function AttendancePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <p className="text-sm text-slate-600">
        Daily attendance, check-in/check-out events, lateness, overtime, and source tracking.
      </p>
      <DataTable
        title="Recent Attendance Events"
        headers={["Employee", "Date", "Check-in", "Check-out", "Source"]}
        rows={[
          ["Rohit Sharma", "2026-05-13", "09:03", "18:11", "Mobile"],
          ["Priya Verma", "2026-05-13", "09:18", "18:22", "Biometric"],
          ["Ananya Singh", "2026-05-13", "-", "-", "Leave"],
        ]}
      />
    </div>
  );
}
