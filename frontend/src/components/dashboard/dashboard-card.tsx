import { Card } from "@/components/ui/card";

type DashboardCardProps = {
  title: string;
  value: string;
  trend?: string;
};

export function DashboardCard({ title, value, trend }: DashboardCardProps) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {trend ? <p className="mt-1 text-xs text-emerald-600">{trend}</p> : null}
    </Card>
  );
}
