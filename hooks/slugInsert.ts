import { message } from "antd";

export async function slugInsert(supabase: any, table: string, values: any) {
  const baseSlug = slugify(values.name_fr);
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) break;
    slug = `${baseSlug}-${count++}`;
  }

  const { error } = await supabase.from(table).insert([{ ...values, slug }]);
  if (error) {
    message.error(error.message);
    return false;
  }
  message.success(`${table} ajouté !`);
  return true;
}

function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
