import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/requireRole";
import { generateNoticeEmailHtml } from "@/utils/EmailTemplate";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };
type Locale = "fr" | "en" | "nl";

const copy: Record<Locale, {
  subject: string; title: string; greeting: (name: string) => string;
  approved: (company: string) => string; benefits: string; button: string;
}> = {
  fr: {
    subject: "PexxaFloor · Votre compte PRO est activé",
    title: "Votre compte PRO est activé",
    greeting: (name) => `Bonjour ${name},`,
    approved: (company) => `Bonne nouvelle : votre demande de compte professionnel pour ${company} a été validée.`,
    benefits: "Connectez-vous pour profiter de vos prix PRO, enregistrer vos devis et les partager avec vos clients.",
    button: "Accéder à mon espace",
  },
  en: {
    subject: "PexxaFloor · Your PRO account is active",
    title: "Your PRO account is active",
    greeting: (name) => `Hello ${name},`,
    approved: (company) => `Good news: your professional account request for ${company} has been approved.`,
    benefits: "Log in to enjoy your PRO prices, save your quotes and share them with your customers.",
    button: "Go to my account",
  },
  nl: {
    subject: "PexxaFloor · Uw PRO-account is geactiveerd",
    title: "Uw PRO-account is geactiveerd",
    greeting: (name) => `Hallo ${name},`,
    approved: (company) => `Goed nieuws: uw aanvraag voor een professioneel account voor ${company} is goedgekeurd.`,
    benefits: "Log in om te genieten van uw PRO-prijzen, uw offertes op te slaan en ze met uw klanten te delen.",
    button: "Naar mijn account",
  },
};

// Tells the customer their PRO application was approved. Called by the admin page after approval.
export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const site = process.env.NEXT_PUBLIC_URL?.trim();
  if (!apiKey || !from || !site) {
    return NextResponse.json({ error: "Email sending is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { data: application } = await supabaseServer
    .from("pro_applications")
    .select("user_id, first_name, company_name, email, status")
    .eq("id", id)
    .maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  // Only ever sent for an application that really is approved
  if (application.status !== "VERIFIED") {
    return NextResponse.json({ error: "Application is not approved" }, { status: 409 });
  }

  // Account email is authoritative; the contact email of the application is the fallback
  const { data: account } = await supabaseServer.auth.admin.getUserById(application.user_id);
  const to = account.user?.email || application.email;
  if (!to) return NextResponse.json({ error: "No email for this customer" }, { status: 400 });

  // No language is stored for accounts: use the one of their latest order, else French
  const { data: lastOrder } = await supabaseServer
    .from("orders")
    .select("language")
    .eq("user_id", application.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const locale: Locale = lastOrder?.language === "nl" || lastOrder?.language === "en" ? lastOrder.language : "fr";
  const t = copy[locale];
  const accountUrl = new URL(`/${locale}/profile`, site).toString();

  const paragraphs = [t.greeting(application.first_name || ""), t.approved(application.company_name), t.benefits]
    .map((paragraph) => paragraph.replace(" ,", ","));

  const result = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: process.env.RESEND_REPLY_TO?.trim() || undefined,
    subject: t.subject,
    html: generateNoticeEmailHtml({ locale, title: t.title, paragraphs, button: { label: t.button, url: accountUrl } }),
    text: [...paragraphs, `${t.button}: ${accountUrl}`].join("\n\n"),
  });

  if (result.error || !result.data?.id) {
    console.error("PRO approval email failed", { applicationId: id, reason: result.error?.name });
    return NextResponse.json({ error: "Unable to send the email" }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
