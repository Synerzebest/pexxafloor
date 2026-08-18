"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Building2, Percent, Save, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

type ProUser = { id: string; email: string | null; name: string | null; company_name: string | null };
type Category = { id: string; name_fr: string; name_nl: string; name_en: string; discount: number | null };
type Discount = { user_id: string; category_id: string; discount_percent: number };

export default function ProDiscountsPage() {
  const locale = useLocale() as "fr" | "nl" | "en";
  const t = useTranslations("AdminProDiscounts");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<ProUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getCategoryName = (category: Category) =>
    locale === "fr" ? category.name_fr : locale === "nl" ? category.name_nl : category.name_en;

  async function load(query = "") {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pro-discounts?search=${encodeURIComponent(query)}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as {
        users: ProUser[];
        categories: Category[];
        discounts: Discount[];
      };
      setUsers(data.users);
      setCategories(data.categories);
      setDiscounts(data.discounts);
      setSelectedUserId((current) =>
        current && data.users.some((user) => user.id === current) ? current : data.users[0]?.id || null
      );
    } catch (error) {
      console.error(error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => load(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!selectedUserId) {
      setValues({});
      return;
    }
    setValues(
      Object.fromEntries(
        discounts
          .filter((discount) => discount.user_id === selectedUserId)
          .map((discount) => [discount.category_id, String(discount.discount_percent)])
      )
    );
  }, [selectedUserId, discounts]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  async function save() {
    if (!selectedUserId) return;
    const invalid = Object.values(values).some(
      (value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)
    );
    if (invalid) {
      toast.error(t("invalidDiscount"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/pro-discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUserId,
          discounts: categories.map((category) => ({
            categoryId: category.id,
            discountPercent: values[category.id] === "" || values[category.id] === undefined
              ? null
              : Number(values[category.id]),
          })),
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success(t("saved"));
      await load(search);
    } catch (error) {
      console.error(error);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href={`/${locale}/admin`} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700">
          <ArrowLeft className="h-4 w-4" />{t("back")}
        </Link>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">PexxaFloor Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">{t("description")}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            </div>
            <div className="mt-4 max-h-[65vh] space-y-2 overflow-y-auto">
              {loading ? <p className="p-4 text-sm text-gray-400">{t("loading")}</p> : users.length === 0 ? <p className="p-4 text-sm text-gray-500">{t("noUsers")}</p> : users.map((user) => {
                const active = user.id === selectedUserId;
                const customCount = discounts.filter((discount) => discount.user_id === user.id).length;
                return (
                  <button key={user.id} type="button" onClick={() => setSelectedUserId(user.id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-orange-300 bg-orange-50" : "border-transparent hover:border-gray-200 hover:bg-gray-50"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-500"}`}><UserRound className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{user.company_name || user.name || user.email}</p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                        {customCount > 0 && <p className="mt-1 text-xs font-medium text-orange-700">{t("customCount", { count: customCount })}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {!selectedUser ? (
              <div className="grid min-h-80 place-items-center p-8 text-center text-sm text-gray-500">{t("selectUser")}</div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-950 text-white"><Building2 className="h-5 w-5" /></div>
                    <div><h2 className="font-semibold text-gray-950">{selectedUser.company_name || selectedUser.name || selectedUser.email}</h2><p className="text-sm text-gray-500">{selectedUser.email}</p></div>
                  </div>
                  <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? t("saving") : t("save")}</button>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">{t("ruleHelp")}</div>
                  <div className="divide-y divide-gray-100">
                    {categories.map((category) => {
                      const hasCustom = values[category.id] !== undefined && values[category.id] !== "";
                      return (
                        <div key={category.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_180px] sm:items-center">
                          <div><p className="font-medium text-gray-900">{getCategoryName(category)}</p><p className="mt-1 text-xs text-gray-500">{t("generalDiscount", { discount: Number(category.discount || 0) })} · {hasCustom ? t("customApplied") : t("generalApplied")}</p></div>
                          <div className="relative">
                            <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input type="number" min={0} max={100} step="0.01" value={values[category.id] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [category.id]: event.target.value }))} placeholder={t("inheritPlaceholder", { discount: Number(category.discount || 0) })} className={`w-full rounded-xl border py-2.5 pl-3 pr-9 text-sm outline-none focus:ring-2 ${hasCustom ? "border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-orange-100" : "border-gray-200 focus:border-orange-400 focus:ring-orange-100"}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
