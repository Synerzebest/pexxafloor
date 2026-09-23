import { orderStatusHandler } from "@/lib/orderStatus";

export const POST = orderStatusHandler(["admin"], ["paid"], "preparing");
