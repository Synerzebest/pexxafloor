// Statuses in which customers can still change their delivery address themselves
// (before the order leaves the warehouse). Admins can change it in any status except "delivered".
export const CUSTOMER_ADDRESS_EDITABLE_STATUSES = ["paid", "preparing", "verification", "packed", "ready"];
