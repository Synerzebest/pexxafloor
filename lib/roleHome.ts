// Page where each staff role lands after logging in. Customers (client, collaborator) get null
// and keep the normal destination (requested page or profile).
const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  storekeeper: "/storekeeper",
  delivery: "/delivery",
};

export function roleHomePath(role: string | null | undefined, locale: string): string | null {
  const home = role ? ROLE_HOME[role] : undefined;
  return home ? `/${locale}${home}` : null;
}
