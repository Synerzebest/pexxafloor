import { getLocale } from "next-intl/server";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordUpdated?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  return (
    <LoginForm
      locale={locale}
      passwordUpdated={params.passwordUpdated === "1"}
    />
  );
}
