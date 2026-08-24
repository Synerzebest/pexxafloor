"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Building2, ChevronDown, ChevronRight, Percent, Save, Search, UserRound } from "lucide-react";
import { toast } from "sonner";

type ProUser = { id: string; email: string | null; name: string | null; company_name: string | null };
type TranslatedName = { id: string; name_fr: string; name_nl: string; name_en: string };
type Subsubcategory = TranslatedName;
type Subcategory = TranslatedName & { subsubcategories: Subsubcategory[] };
type Category = TranslatedName & { discount: number | null; subcategories: Subcategory[] };
type TargetType = "category" | "subcategory" | "subsubcategory";
type Discount = { user_id: string; target_type: TargetType; target_id: string; discount_percent: number };

const targetKey = (type: TargetType, id: string) => `${type}:${id}`;

export default function ProDiscountsPage() {
  const locale = useLocale() as "fr" | "nl" | "en";
  const t = useTranslations("AdminProDiscounts");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<ProUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getName = (item: TranslatedName) =>
    locale === "fr" ? item.name_fr : locale === "nl" ? item.name_nl : item.name_en;

  async function load(query = "") {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pro-discounts?search=${encodeURIComponent(query)}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as { users: ProUser[]; categories: Category[]; discounts: Discount[] };
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
    if (!selectedUserId) return setValues({});
    setValues(Object.fromEntries(
      discounts
        .filter((discount) => discount.user_id === selectedUserId)
        .map((discount) => [targetKey(discount.target_type, discount.target_id), String(discount.discount_percent)])
    ));
  }, [selectedUserId, discounts]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const allTargets = useMemo(() => categories.flatMap((category) => [
    { type: "category" as const, id: category.id },
    ...category.subcategories.flatMap((subcategory) => [
      { type: "subcategory" as const, id: subcategory.id },
      ...subcategory.subsubcategories.map((item) => ({ type: "subsubcategory" as const, id: item.id })),
    ]),
  ]), [categories]);

  const inheritedDiscount = (category: Category, subcategory?: Subcategory) => {
    if (subcategory) {
      const subValue = values[targetKey("subcategory", subcategory.id)];
      if (subValue !== undefined && subValue !== "") return Number(subValue);
    }
    const categoryValue = values[targetKey("category", category.id)];
    if (categoryValue !== undefined && categoryValue !== "") return Number(categoryValue);
    return Number(category.discount || 0);
  };

  async function save() {
    if (!selectedUserId) return;
    const invalid = Object.values(values).some(
      (value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)
    );
    if (invalid) return toast.error(t("invalidDiscount"));

    setSaving(true);
    try {
      const response = await fetch("/api/admin/pro-discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUserId,
          discounts: allTargets.map((target) => {
            const value = values[targetKey(target.type, target.id)];
            return {
              targetType: target.type,
              targetId: target.id,
              discountPercent: value === "" || value === undefined ? null : Number(value),
            };
          }),
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

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) =>
    setter((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const renderDiscountInput = (type: TargetType, id: string, inherited: number) => {
    const key = targetKey(type, id);
    const hasCustom = values[key] !== undefined && values[key] !== "";
    return (
      <div className="relative w-full sm:w-48">
        <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="number" min={0} max={100} step="0.01" value={values[key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} placeholder={t("inheritedPlaceholder", { discount: inherited })} aria-label={t("customDiscountLabel")} className={`w-full rounded-xl border py-2.5 pl-3 pr-9 text-sm outline-none focus:ring-2 ${hasCustom ? "border-orange-300 bg-orange-50 focus:border-orange-500 focus:ring-orange-100" : "border-gray-200 bg-white focus:border-orange-400 focus:ring-orange-100"}`} />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href={`/${locale}/admin`} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"><ArrowLeft className="h-4 w-4" />{t("back")}</Link>
        <div className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">PexxaFloor Admin</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{t("title")}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">{t("description")}</p></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div>
            <div className="mt-4 max-h-[65vh] space-y-2 overflow-y-auto">
              {loading ? <p className="p-4 text-sm text-gray-400">{t("loading")}</p> : users.length === 0 ? <p className="p-4 text-sm text-gray-500">{t("noUsers")}</p> : users.map((user) => {
                const active = user.id === selectedUserId;
                const customCount = discounts.filter((discount) => discount.user_id === user.id).length;
                return <button key={user.id} type="button" onClick={() => setSelectedUserId(user.id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-orange-300 bg-orange-50" : "border-transparent hover:border-gray-200 hover:bg-gray-50"}`}><div className="flex items-start gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-500"}`}><UserRound className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-900">{user.company_name || user.name || user.email}</p><p className="truncate text-xs text-gray-500">{user.email}</p>{customCount > 0 && <p className="mt-1 text-xs font-medium text-orange-700">{t("customCount", { count: customCount })}</p>}</div></div></button>;
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {!selectedUser ? <div className="grid min-h-80 place-items-center p-8 text-center text-sm text-gray-500">{t("selectUser")}</div> : <>
              <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-950 text-white"><Building2 className="h-5 w-5" /></div><div><h2 className="font-semibold text-gray-950">{selectedUser.company_name || selectedUser.name || selectedUser.email}</h2><p className="text-sm text-gray-500">{selectedUser.email}</p></div></div><button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? t("saving") : t("save")}</button></div>
              <div className="p-5 sm:p-6">
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">{t("ruleHelp")}</div>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const categoryOpen = expandedCategories.has(category.id);
                    const categoryInherited = Number(category.discount || 0);
                    return <div key={category.id} className="overflow-hidden rounded-2xl border border-gray-200">
                      <div className="flex flex-col gap-3 bg-gray-50 p-4 sm:flex-row sm:items-center"><button type="button" onClick={() => toggleSet(setExpandedCategories, category.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">{categoryOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}<div><p className="font-semibold text-gray-950">{getName(category)}</p><p className="mt-0.5 text-xs text-gray-500">{t("categoryLevel")} · {t("generalDiscount", { discount: categoryInherited })}</p></div></button>{renderDiscountInput("category", category.id, categoryInherited)}</div>
                      {categoryOpen && <div className="divide-y divide-gray-100 border-t border-gray-200">
                        {category.subcategories.length === 0 ? <p className="p-4 text-sm text-gray-400">{t("noChildren")}</p> : category.subcategories.map((subcategory) => {
                          const subOpen = expandedSubcategories.has(subcategory.id);
                          const subInherited = inheritedDiscount(category);
                          return <div key={subcategory.id}>
                            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:pl-9"><button type="button" onClick={() => toggleSet(setExpandedSubcategories, subcategory.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">{subcategory.subsubcategories.length > 0 ? subOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" /> : <span className="w-4" />}<div><p className="font-medium text-gray-900">{getName(subcategory)}</p><p className="text-xs text-gray-500">{t("subcategoryLevel")} · {t("inheritsDiscount", { discount: subInherited })}</p></div></button>{renderDiscountInput("subcategory", subcategory.id, subInherited)}</div>
                            {subOpen && subcategory.subsubcategories.map((subsubcategory) => {
                              const inherited = inheritedDiscount(category, subcategory);
                              return <div key={subsubcategory.id} className="flex flex-col gap-3 border-t border-gray-50 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:pl-16"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-800">{getName(subsubcategory)}</p><p className="text-xs text-gray-500">{t("subsubcategoryLevel")} · {t("inheritsDiscount", { discount: inherited })}</p></div>{renderDiscountInput("subsubcategory", subsubcategory.id, inherited)}</div>;
                            })}
                          </div>;
                        })}
                      </div>}
                    </div>;
                  })}
                </div>
              </div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}
