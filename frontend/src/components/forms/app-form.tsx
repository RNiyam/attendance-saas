"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
};

type AppFormProps = {
  title: string;
  fields: Field[];
  submitLabel: string;
  onSubmit?: (values: Record<string, string>) => void | Promise<void>;
  submitting?: boolean;
  errorMessage?: string | null;
};

export function AppForm({ title, fields, submitLabel, onSubmit, submitting, errorMessage }: AppFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSubmit) return;
    const formData = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      values[key] = String(value);
    }
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {fields.map((field) => (
        <label key={field.name} className="block space-y-2">
          <span className="text-sm text-slate-600">{field.label}</span>
          <Input name={field.name} type={field.type ?? "text"} placeholder={field.placeholder} />
        </label>
      ))}
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Please wait..." : submitLabel}
      </Button>
    </form>
  );
}
