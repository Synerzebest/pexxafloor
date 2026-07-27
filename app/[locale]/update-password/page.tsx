import { getLocale } from "next-intl/server";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const locale = await getLocale();
  return <UpdatePasswordForm locale={locale} />;
}
