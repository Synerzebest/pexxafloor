import "server-only";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildOrderMessage, type OrderEmailSnapshot } from "./orderMessage";

type EmailRequest = { from: string; to: string; subject: string; html: string; text: string; replyTo?: string };
type OutboxEntry = {
  id: string;
  order_id: string;
  attempts: number;
  payload: OrderEmailSnapshot;
  request_payload: EmailRequest | null;
};

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const site = process.env.NEXT_PUBLIC_URL?.trim();
  if (!apiKey || !from || !site) {
    const missing = [
      !apiKey && "RESEND_API_KEY",
      !from && "RESEND_FROM_EMAIL",
      !site && "NEXT_PUBLIC_URL",
    ].filter(Boolean);
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }
  if (from.includes("@resend.dev")) throw new Error("Use a verified Resend sending domain");
  const url = new URL(site);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Invalid NEXT_PUBLIC_URL");
  }
  return { apiKey, from, siteUrl: url.origin, replyTo: process.env.RESEND_REPLY_TO?.trim() || undefined };
}

async function makeRequest(entry: OutboxEntry, config: ReturnType<typeof emailConfig>): Promise<EmailRequest> {
  // Auth is authoritative: profiles.email can be missing or out of date.
  const { data, error } = await supabaseServer.auth.admin.getUserById(entry.payload.user_id);
  if (error || !data.user?.email) throw new Error("Unable to find the order owner's email");
  return {
    from: config.from, to: data.user.email, replyTo: config.replyTo,
    ...buildOrderMessage(entry.payload, config.siteUrl),
  };
}

export async function processOrderEmails(orderId?: string, limit = 10) {
  const config = emailConfig();
  const resend = new Resend(config.apiKey);
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < limit; index++) {
    const { data, error } = await supabaseServer.rpc("claim_order_email", { p_order_id: orderId ?? null });
    if (error) throw new Error("Email queue unavailable: apply the order_email_outbox migration");
    const entry = data?.[0] as OutboxEntry | undefined;
    if (!entry) break;
    try {
      let request = entry.request_payload;
      if (!request) {
        request = await makeRequest(entry, config);
        // Keep the exact request across retries for Resend's idempotency check.
        const { error: saveError } = await supabaseServer.from("order_email_outbox")
          .update({ request_payload: request }).eq("id", entry.id).eq("attempts", entry.attempts);
        if (saveError) throw new Error("Unable to save the email request");
      }
      const result = await resend.emails.send(request, { idempotencyKey: `order-event/${entry.id}` });
      if (result.error || !result.data?.id) {
        throw new Error(result.error ? `Resend: ${result.error.name}` : "Resend returned no email ID");
      }
      const { error: saveError } = await supabaseServer.from("order_email_outbox").update({
        sent_at: new Date().toISOString(), resend_id: result.data.id, locked_until: null, last_error: null,
      }).eq("id", entry.id).eq("attempts", entry.attempts);
      if (saveError) throw new Error("Email accepted but receipt could not be saved");
      sent++;
    } catch (error) {
      failed++;
      const reason = error instanceof Error ? error.message : "Email delivery failed";
      console.error("Order email failed", { notificationId: entry.id, reason });
      const delayMinutes = Math.min(60, 5 * 2 ** Math.min(entry.attempts - 1, 4));
      const { error: retryError } = await supabaseServer.from("order_email_outbox").update({
        locked_until: null, last_error: reason,
        available_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
      }).eq("id", entry.id).eq("attempts", entry.attempts);
      if (retryError) throw new Error("Unable to schedule the email retry");
    }
    // Stay below Resend's default per-second rate when draining a queue.
    if (index + 1 < limit) await new Promise(resolve => setTimeout(resolve, 600));
  }
  return { sent, failed };
}

// Order state must remain truthful even when the email provider is unavailable.
export async function notifyOrder(orderId: string) {
  try {
    const result = await processOrderEmails(orderId, 7);
    const { count, error } = await supabaseServer.from("order_email_outbox")
      .select("id", { count: "exact", head: true }).eq("order_id", orderId).is("sent_at", null);
    if (error) throw new Error("Unable to check pending notifications");
    return { ...result, pending: Boolean(count) };
  } catch (error) {
    console.error("Order notification pending", {
      orderId, reason: error instanceof Error ? error.message : "Email unavailable",
    });
    return { sent: 0, failed: 1, pending: true };
  }
}
