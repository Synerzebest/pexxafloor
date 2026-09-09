import { getLocale } from "next-intl/server";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ recoveryError?: string }>;
}) {
  const locale = await getLocale();
  const { recoveryError } = await searchParams;
  return <UpdatePasswordForm locale={locale} recoveryError={Boolean(recoveryError)} />;
}
