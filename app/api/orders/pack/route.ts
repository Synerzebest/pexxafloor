import { orderStatusHandler } from "@/lib/orderStatus";

export const POST = orderStatusHandler(["admin", "storekeeper"], ["preparing", "verification"], "packed");
