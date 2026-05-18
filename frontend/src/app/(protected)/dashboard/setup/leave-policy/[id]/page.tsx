"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import LeavePolicyTemplateForm, {
  mapApiToFormValues,
} from "@/components/leave/leave-policy-template-form";
import { apiBaseUrl, authenticatedFetch } from "@/services/http";

function EditLeavePolicyContent() {
  const params = useParams();
  const router = useRouter();
  const templateId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<ReturnType<typeof mapApiToFormValues> | null>(null);

  useEffect(() => {
    if (!Number.isFinite(templateId) || templateId <= 0) {
      setLoading(false);
      return;
    }
    const id = window.setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${apiBaseUrl}/api/leave/policy-templates/${templateId}`);
        if (res.ok) {
          const data = await res.json();
          setInitialValues(mapApiToFormValues(data));
        }
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [templateId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
        Loading policy…
      </div>
    );
  }

  if (!initialValues) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <p className="text-[14px] font-medium text-[#667085]">Leave policy not found.</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/setup/leave-policy")}
          className="text-[13px] font-bold text-[#2563EB] hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  return <LeavePolicyTemplateForm mode="edit" templateId={templateId} initialValues={initialValues} />;
}

export default function EditLeavePolicyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-[13px] font-medium text-[#98A2B3]">
          Loading…
        </div>
      }
    >
      <EditLeavePolicyContent />
    </Suspense>
  );
}
