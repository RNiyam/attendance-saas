import { DataTable } from "@/components/shared/data-table";

export default function PayrollPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payroll</h1>
      <p className="text-sm text-slate-600">Payroll cycle runs, adjustments, and payslip management placeholders.</p>
      <DataTable
        title="Current Payroll Cycle"
        headers={["Cycle", "Employees", "Gross", "Net", "Status"]}
        rows={[["May 2026", "247", "INR 2.1Cr", "INR 1.7Cr", "Draft"]]}
      />
    </div>
  );
}
