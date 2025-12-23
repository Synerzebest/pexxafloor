"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import UserProApplicationCard from "./UserProApplicationCard";

export default function ProButton({
  locale,
  userId,
}: {
  locale: string;
  userId: string;
}) {
  const t = useTranslations("Profile");

  // NEW: création du client Supabase côté client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isPro, setIsPro] = useState(false);
  const [hasApp, setHasApp] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: app, error } = await supabase
        .from("pro_applications")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      setHasApp(!!app);
      setIsPro(app?.status === "VERIFIED");
    }

    check();
  }, [userId]);

  return (
    <div className="w-full my-12">
      {!isPro && !hasApp && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("pro.title")}
            </h3>
            <p className="mt-1 text-sm text-gray-700">{t("pro.desc")}</p>
          </div>
          <Link
            href={`/${locale}/pro-signup`}
            className="w-fit mt-4 sm:mt-0 inline-block rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2 text-white font-medium"
          >
            {t("pro.button")}
          </Link>
        </div>
      )}

      {(hasApp || isPro) && <UserProApplicationCard userId={userId} />}
    </div>
  );
}
