'use server';

import { supabaseServer } from "../../../lib/supabaseServer";

export async function updateProApplication(
  id: string,
  data: any
) {
  const { error } = await supabaseServer
    .from("pro_applications")
    .update(data)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
