"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import { LogOutIcon, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { User as UserType } from "@supabase/supabase-js";



const UserButton: React.FC = () => {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const locale = useLocale();

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const t = useTranslations("UserButton");

  const closeMenu = useCallback(() => setOpen(false), []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    closeMenu();
    window.location.href= "/";
  };

  // Charger l’utilisateur Supabase
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  // Clique extérieur + Escape
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeMenu]);

  // Focus le 1er item à l’ouverture
  useEffect(() => {
    if (open && firstItemRef.current) firstItemRef.current.focus();
  }, [open]);

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" aria-busy="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium px-3 py-1.5 rounded-full bg-gray-900 text-white hover:opacity-90 transition"
      >
        {t('login')}
      </Link>
    );
  }

  // Supabase user: name & photo dans `user.user_metadata`
  const initials =
    user.user_metadata?.full_name?.trim()?.split(/\s+/).map((s: string) => s[0]?.toUpperCase()).slice(0, 2).join("") || "U";

  return (
    <div ref={rootRef} className="relative z-10">
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        onKeyDown={onButtonKeyDown}
        className="cursor-pointer inline-flex items-center gap-2 rounded-full px-0 md:px-2 py-1.5 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition"
      >
        {/* Avatar + fallback */}
        <span className="relative inline-flex h-8 w-8 items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
              priority
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 grid place-items-center text-sm font-semibold">
              {initials}
            </span>
          )}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>
        <span className="hidden md:block text-sm font-medium text-gray-800 max-w-[10rem] truncate">
          {user.user_metadata?.full_name || "User"}
        </span>
      </button>

      {/* Menu animé Framer Motion */}
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
            className={`
                absolute
                origin-bottom md:origin-top  
                bottom-full md:bottom-auto     
                mb-2 md:mb-0                  
                left-0 md:left-auto md:right-0
                w-56 md:w-64
                rounded-2xl bg-white shadow-lg ring-1 ring-black/5
            `}
            >        
            <div className="p-2">
              {/* Header user */}
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
                <div className="relative inline-flex h-10 w-10 items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name || "User"}
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
                    {user.user_metadata?.full_name || "User"}
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-800 hover:bg-gray-50 focus:outline-none"
                  >
                    <User />
                    <span>{t('profilePage')}</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleSignOut}
                    className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-red-600 hover:bg-red-50 focus:outline-none"
                    role="menuitem"
                  >
                    <LogOutIcon className="shrink-0" />
                    <span>{t('signOut')}</span>
                  </button>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserButton;
