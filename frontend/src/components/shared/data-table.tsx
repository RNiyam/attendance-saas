import { Card, CardTitle } from "@/components/ui/card";

type DataTableProps = {
  title: string;
  headers: string[];
  rows: string[][];
};

export function DataTable({ title, headers, rows }: DataTableProps) {
  return (
    <Card className="overflow-x-auto">
      <CardTitle className="mb-4">{title}</CardTitle>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-slate-500">
            {headers.map((header) => (
              <th key={header} className="pb-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-border/70">
              {row.map((cell) => (
                <td key={cell} className="py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
