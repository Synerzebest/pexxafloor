import type { Status } from "@/types/StatusType";
import type { ActionType } from "@/hooks/useProRequestsLogic";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronRight
  } from "lucide-react";
import { STATUS_ACTIONS } from "./actionsConfig";

type Props = {
  status: Status;
  id: string;
  busyId: string | null;
  act: (id: string, action: ActionType) => void;
  t: (key: string) => string;
};
  
const ACTION_META = {
  approve: {
    icon: CheckCircle2,
    className: "bg-emerald-600 hover:bg-emerald-700",
  },
  reject: {
    icon: XCircle,
    className: "bg-red-600 hover:bg-red-700",
  },
  start_review: {
    icon: ChevronRight,
    className: "bg-blue-600 hover:bg-blue-700",
  },
  suspend: {
    icon: XCircle,
    className: "bg-yellow-600 hover:bg-yellow-700",
  },
  revision: {
    icon: ChevronRight,
    className: "bg-yellow-500 hover:bg-yellow-600",
  },
};
  
export function RowActions({
  status,
  id,
  busyId,
  act,
  t,
}: Props) {
    return (
      <div className="flex justify-end gap-2">
        {STATUS_ACTIONS[status].map(action => {
          const meta = ACTION_META[action];
          const Icon = meta.icon;
  
          return (
            <button
              key={action}
              onClick={() => act(id, action)}
              disabled={busyId === id}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-white ${meta.className}`}
            >
              {busyId === id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Icon className="h-4 w-4" />
              }
              <span className="hidden sm:inline">
                {t(action)}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
  