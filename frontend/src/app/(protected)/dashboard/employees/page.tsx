import { DataTable } from "@/components/shared/data-table";

export default function EmployeesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Employees</h1>
      <p className="text-sm text-slate-600">Employee directory, profiles, onboarding, and reporting hierarchy.</p>
      <DataTable
        title="Employee List"
        headers={["Code", "Name", "Department", "Status"]}
        rows={[
          ["EMP-001", "Rohit Sharma", "Engineering", "Active"],
          ["EMP-002", "Priya Verma", "HR", "Active"],
          ["EMP-003", "Ananya Singh", "Finance", "Probation"],
        ]}
      />
    </div>
  );
}
