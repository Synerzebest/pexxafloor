import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export type ActionType =
  | "approve"
  | "reject"
  | "start_review"
  | "suspend"
  | "revision";

const RPC_MAP: Record<ActionType, string> = {
  approve: "approve_pro_application",
  reject: "reject_pro_application",
  start_review: "start_review_pro_application",
  suspend: "suspend_pro_application",
  revision: "revision_pro_application",
};

// Status reached by each action, as keyed in AdminPro.status
const RESULT_STATUS: Record<ActionType, string> = {
  approve: "verified",
  reject: "rejected",
  start_review: "in_review",
  suspend: "suspended",
  revision: "revision",
};

export function useProRequestsLogic() {
  const router = useRouter();
  const t = useTranslations("AdminPro");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: ActionType) {
    setBusyId(id);
    setError(null);

    const { error } = await supabase.rpc(RPC_MAP[action], {
      app_id: id,
    });

    setBusyId(null);

    if (error) {
      setError(error.message);
      toast.error(t("toast.statusError"), { description: error.message });
      return;
    }

    toast.success(t("toast.statusChanged", { status: t(`status.${RESULT_STATUS[action]}`) }));
    router.refresh();
  }

  return { busyId, error, act };
}
