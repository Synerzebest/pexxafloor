import { Status } from "@/types/StatusType";

const STATUS_STYLES: Record<Status, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-gray-200 text-gray-700",
  REVISION: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status, label }: {
  status: Status;
  label: string;
}) {
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}
