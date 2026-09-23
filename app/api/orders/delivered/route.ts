import { orderStatusHandler } from "@/lib/orderStatus";

export const POST = orderStatusHandler(["admin", "delivery"], ["delivering"], "delivered");
