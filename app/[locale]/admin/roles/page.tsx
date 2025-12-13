"use client";

import { useEffect, useState } from "react";
import { Table, Select, Input } from "antd";
import { Navbar, Footer } from "@/components";
import { SearchOutlined } from "@ant-design/icons";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import RoleAccessInfo from "@/components/admin/profiles/RoleAccessInfo";

type Profile = {
  id: string;
  email: string | null;
  user_role: string | null;
};

// dictionnaire des traductions
type RoleKey = "storekeeper" | "delivery" | "client" | "collaborator" | "admin";
type LangKey = "fr" | "nl" | "en";

const roleTranslations: Record<RoleKey, Record<LangKey, string>> = {
  storekeeper: { fr: "Magasinier", nl: "Magazijnier", en: "Storekeeper" },
  delivery: { fr: "Livreur", nl: "Koerier", en: "Delivery" },
  client: { fr: "Client", nl: "Klant", en: "Client" },
  collaborator: { fr: "Collaborateur", nl: "Medewerker", en: "Collaborator"},
  admin: { fr: "Administrateur", nl: "Beheerder", en: "Administrator"}
};


export default function ProfilesAdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const locale = useLocale();

  const fetchProfiles = async (term = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles?search=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (res.ok) setProfiles(data);
      else toast.error(data.error || "Erreur lors du chargement des profils");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_role: newRole }),
      });
      if (res.ok) {
        toast.success("Rôle mis à jour");
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, user_role: newRole } : p))
        );
      } else {
        const { error } = await res.json();
        toast.error(error || "Erreur lors de la mise à jour du rôle");
      }
    } catch {
      toast.error("Server error");
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const getLabel = (role: string) => {
    const r = role as RoleKey; // on caste en clé valide
    return roleTranslations[r]?.[locale as LangKey] || role;
  };  

  return (
    <>
      <Navbar />

      <div className="p-8 relative top-32">
       <RoleAccessInfo locale={locale} />

        <h1 className="text-2xl font-bold mb-6">
          {locale === "fr"
            ? "Gestion des profils"
            : locale === "nl"
            ? "Beheer van profielen"
            : "Profile management"}
        </h1>

        <Input
          prefix={<SearchOutlined />}
          placeholder={
            locale === "fr"
              ? "Rechercher par email"
              : locale === "nl"
              ? "Zoeken op e-mail"
              : "Search by email"
          }
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            fetchProfiles(val);
          }}
          style={{ maxWidth: 400, marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          dataSource={profiles}
          loading={loading}
          columns={[
            { title: "Email", dataIndex: "email" },
            {
              title:
                locale === "fr"
                  ? "Rôle"
                  : locale === "nl"
                  ? "Rol"
                  : "Role",
              render: (record: Profile) => (
                <Select
                  style={{ minWidth: 150 }}
                  value={record.user_role || "storekeeper"}
                  onChange={(value) => handleRoleChange(record.id, value)}
                  options={Object.keys(roleTranslations).map((key) => ({
                    label: getLabel(key),
                    value: key,
                  }))}
                />
              ),
            },
          ]}
        />
      </div>

      <div className="relative top-32">
        <Footer />
      </div>
    </>
  );
}
