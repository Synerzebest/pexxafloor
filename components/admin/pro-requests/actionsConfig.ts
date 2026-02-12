import { ActionType } from "@/hooks/useProRequestsLogic";
import { Status } from "@/types/StatusType"

export const STATUS_ACTIONS: Record<
  Status,
  ActionType[]
> = {
  PENDING: ["start_review"],
  IN_REVIEW: ["approve", "reject"],
  VERIFIED: ["suspend"],
  REJECTED: ["revision"],
  REVISION: ["approve", "reject"],
  SUSPENDED: ["approve"],
};
