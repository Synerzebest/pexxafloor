import { getLocale } from "next-intl/server";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  return <ForgotPasswordForm locale={locale} />;
}
