import { orderStatusHandler } from "@/lib/orderStatus";

export const POST = orderStatusHandler(["admin", "storekeeper", "delivery"], ["packed"], "ready");
