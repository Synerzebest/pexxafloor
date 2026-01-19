"use client";

import { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogOutIcon, User as UserIcon } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthProvider";

type Profile = {
  id: string;
  name: string | null;
};

export default function UserButton() {
  const locale = useLocale();
  const t = useTranslations("UserButton");

  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  /* 🔁 Charger le profile UNIQUEMENT quand user change */
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      if(!user) return

      const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setProfile(data ?? null);
        setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  /** 🔐 Logout */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // PAS de reload : l'AuthProvider gère tout
  };

  /** 🔒 Fermer menu sur clic extérieur + Escape */
  useEffect(() => {
    const click = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", click, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", click, true);
      document.removeEventListener("keydown", key);
    };
  }, []);

  if (loading || profileLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1.5">
        {/* Avatar skeleton */}
        <span className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
  
        {/* Name skeleton (desktop) */}
        <span className="hidden md:block h-4 w-24 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }
  

  /** === USER NON CONNECTÉ === */
  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="text-sm font-medium px-3 py-1.5 rounded-full bg-gray-900 text-white hover:opacity-90 transition"
      >
        {t("login")}
      </Link>
    );
  }

  /** === USER CONNECTÉ === */
  const displayName = user.user_metadata?.full_name || profile?.name || "Me";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={rootRef} className="relative z-10">
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer inline-flex items-center gap-2 rounded-full px-0 md:px-2 py-1.5 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
      >
        {/* Avatar */}
        <span className="relative inline-flex h-8 w-8 items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 grid place-items-center text-sm font-semibold">
              {initials}
            </span>
          )}

          {/* petit point vert */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>

        <span className="hidden md:block text-sm font-medium text-gray-800 max-w-[10rem] truncate">
          {displayName}
        </span>
      </button>

      {/* === MENU === */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="user-menu"
            role="menu"
            aria-label="User menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="
              absolute
              origin-bottom md:origin-top
              bottom-full md:bottom-auto
              mb-2 md:mb-0
              left-0 md:left-auto md:right-0
              w-56 md:w-64
              rounded-2xl bg-white shadow-lg ring-1 ring-black/5
            "
          >
            <div className="p-2">
              {/* Header */}
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
                <div className="relative inline-flex h-10 w-10 items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="h-10 w-10 rounded-full bg-gray-200 text-gray-700 grid place-items-center text-sm font-semibold">
                      {initials}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="my-2 h-px bg-gray-100" />

              {/* Items */}
              <ul className="flex flex-col">
                <li>
                  <Link
                    href={`/${locale}/profile`}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-800 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    <UserIcon size={16} />
                    {t("profilePage")}
                  </Link>
                </li>

                <li>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOutIcon size={16} />
                    {t("signOut")}
                  </button>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
