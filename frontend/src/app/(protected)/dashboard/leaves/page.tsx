import { DataTable } from "@/components/shared/data-table";

export default function LeavesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Leaves</h1>
      <p className="text-sm text-slate-600">Leave balances, leave requests, and approval workflow.</p>
      <DataTable
        title="Pending Requests"
        headers={["Employee", "Leave Type", "From", "To", "Status"]}
        rows={[
          ["Ananya Singh", "Sick Leave", "2026-05-14", "2026-05-15", "Pending"],
          ["Rohit Sharma", "Casual Leave", "2026-05-20", "2026-05-20", "Approved"],
        ]}
      />
    </div>
  );
}
