"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, UserPlus, Mail, MailCheck } from "lucide-react";
import { signupWithEmail } from "@/app/actions/signupEmail";
import PasswordInput from "@/components/ui/PasswordInput";

export default function SignupForm({
  locale,
  nextPath,
}: {
  locale: string;
  nextPath?: string;
}) {
  const t = useTranslations("Signup");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    setErr(null);

    if (!email.trim() || !pwd) return setErr(t("errors.required"));
    if (pwd.length < 8) return setErr(t("errors.tooShort"));
    if (pwd !== pwd2) return setErr(t("errors.mismatch"));
    if (!name.trim()) return setErr(t("errors.name_missing"));

    try {
      setLoading(true);
      if (nextPath) formData.set("next", nextPath);
      formData.set("locale", locale);
      const result = await signupWithEmail(formData);

      if (result.error) {
        const errorKeyByCode: Record<string, string> = {
          email_exists: "errors.emailAlreadyUsed",
          user_already_exists: "errors.emailAlreadyUsed",
          weak_password: "errors.weakPassword",
          over_email_send_rate_limit: "errors.emailRateLimit",
          over_request_rate_limit: "errors.requestRateLimit",
          email_address_not_authorized: "errors.emailNotAuthorized",
          signup_disabled: "errors.signupDisabled",
          email_provider_disabled: "errors.signupDisabled",
        };

        setErr(t(errorKeyByCode[result.error.code] || "errors.generic"));
        return;
      }

      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }

      router.replace(nextPath || `/${locale}/profile`);
      router.refresh();
    } catch (error) {
      console.error("Signup failed:", error);
      setErr(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
  <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

    {/* LEFT – Branding */}
    <div className="hidden lg:flex flex-col justify-center px-6">
      <Image
        src="/images/logo.png"
        width={120}
        height={80}
        alt="Logo"
        priority
        className="opacity-90"
      />

      <h1 className="mt-10 text-4xl font-semibold tracking-tight text-gray-900 max-w-md">
        {t("title")}
      </h1>

      <p className="mt-4 text-lg text-gray-600 max-w-md leading-relaxed">
        {t("subtitle")}
      </p>
    </div>

    {/* RIGHT – Form */}
    <div className="flex justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-sm">

        {confirmationSent ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-orange-600">
              <MailCheck className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
              {t("confirmation.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {t("confirmation.description")}
            </p>
            <p className="mt-3 break-all font-medium text-gray-900">{email}</p>
            <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-left text-sm leading-6 text-orange-900">
              {t("confirmation.instructions")}
            </div>
            <Link
              href={`/${locale}/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
              className="mt-7 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {t("confirmation.login")}
            </Link>
          </div>
        ) : (
          <>
        {/* Mobile header */}
        <div className="lg:hidden flex flex-col items-center text-center mb-8">
          <Image
            src="/images/logo.png"
            width={90}
            height={60}
            alt="Logo"
            priority
          />
          <h1 className="mt-5 text-2xl font-semibold text-gray-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("name")}
            </label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4
                  focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("email")}
            </label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4
                  focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("password")}
              </label>
              <div className="mt-2">
                <PasswordInput
                  name="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3
                    focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>
            </div>

            <div>
              <PasswordInput
                autoComplete="new-password"
                placeholder={t("confirm")}
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                className="w-full rounded-xl border border-gray-300 py-3
                  focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>
          </div>

          {err && (
            <p className="text-sm text-red-600 text-center">{err}</p>
          )}

          {/* CTA */}
          <button
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-orange-600 py-3 text-white font-medium
              hover:bg-orange-700 transition disabled:bg-orange-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
            {t("cta")}
          </button>

          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="mx-3 text-xs uppercase tracking-wide text-gray-400">
              {t("or")}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <a
            href={`/auth/login/google?next=${encodeURIComponent(nextPath || `/${locale}/profile`)}`}
            className="flex w-full items-center justify-center gap-3 rounded-lg
              border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700
              hover:bg-gray-50 transition"
          >
            <Image
              src="/images/google.png"
              alt="Google"
              width={18}
              height={18}
            />
            {t("google")}
          </a>
        </form>
          </>
        )}
      </div>
    </div>
  </div>
</div>

  );
}
