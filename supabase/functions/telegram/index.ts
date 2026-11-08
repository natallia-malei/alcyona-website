// Edge Function "telegram" — the studio's Telegram bot (migration 016).
//
// POST ?action=setup  — registers this function as the bot's webhook and saves
//                       the bot's username + the drain URL in studio_telegram.
//                       Safe to call again (idempotent).
// POST ?action=drain  — sends queued notifications (called by pg_net / pg_cron).
// POST (from Telegram) — webhook: "/connect CODE" in a group connects that chat.
//                       Checked by the secret header Telegram sends back.
//
// Deployed with --no-verify-jwt: Telegram and pg_net don't send a Supabase JWT.
// None of the endpoints does anything harmful when called by a stranger:
// setup points the webhook at itself, drain only sends what's already queued.
//
// Secrets: TELEGRAM_BOT_TOKEN (supabase secrets set …), SITE_URL (optional).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from "@supabase/supabase-js";
import { buildMessage, escapeHtml, type QueuedNotification } from "./messages.ts";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://alcyona-website.vercel.app").replace(/\/$/, "");
const SELF_URL = `${SUPABASE_URL}/functions/v1/telegram`;

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ----- Telegram API -----

interface TgResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

async function tg<T>(method: string, body: Record<string, unknown>): Promise<TgResponse<T>> {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TgResponse<T>;
}

// Telegram echoes this in X-Telegram-Bot-Api-Secret-Token on every webhook call.
// Derived from the bot token, so there's no extra secret to manage.
async function webhookSecret(): Promise<string> {
  const data = new TextEncoder().encode(`alcyona-webhook:${TOKEN}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ----- setup -----

async function setup(): Promise<Response> {
  const me = await tg<{ username: string }>("getMe", {});
  if (!me.ok || !me.result) return json({ ok: false, step: "getMe", error: me.description }, 500);

  const hook = await tg<boolean>("setWebhook", {
    url: SELF_URL,
    secret_token: await webhookSecret(),
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  if (!hook.ok) return json({ ok: false, step: "setWebhook", error: hook.description }, 500);

  const { error } = await db.rpc("telegram_set_bot", {
    p_username: me.result.username,
    p_notify_url: `${SELF_URL}?action=drain`,
  });
  if (error) return json({ ok: false, step: "telegram_set_bot", error: error.message }, 500);

  return json({ ok: true, username: me.result.username });
}

// ----- drain -----

async function drain(): Promise<Response> {
  let sent = 0;
  let failed = 0;

  // A few rounds, in case new rows arrive while sending
  for (let round = 0; round < 5; round++) {
    const { data, error } = await db.rpc("telegram_claim_notifications", { p_limit: 20 });
    if (error) return json({ ok: false, error: error.message }, 500);
    const rows = (data ?? []) as QueuedNotification[];
    if (rows.length === 0) break;

    for (const n of rows) {
      const message = buildMessage(n, SITE_URL);
      if (!message || n.chat_id === null) {
        await db.rpc("telegram_mark_sent", { p_id: n.id }); // nothing to say / nowhere to say it
        continue;
      }
      const res = await tg("sendMessage", {
        chat_id: n.chat_id,
        ...(n.thread_id !== null && { message_thread_id: n.thread_id }),
        text: message.text,
        parse_mode: "HTML",
        disable_notification: message.silent,
        link_preview_options: { is_disabled: true },
      });
      await db.rpc("telegram_mark_sent", {
        p_id: n.id,
        p_error: res.ok ? null : (res.description ?? "unknown error"),
      });
      if (res.ok) sent++;
      else failed++;
    }
  }
  return json({ ok: true, sent, failed });
}

// ----- webhook -----

interface TgMessage {
  message_id: number;
  message_thread_id?: number;
  is_topic_message?: boolean;
  chat: { id: number; type: string; title?: string };
  text?: string;
}

async function reply(m: TgMessage, text: string): Promise<void> {
  await tg("sendMessage", {
    chat_id: m.chat.id,
    ...(m.is_topic_message && m.message_thread_id && { message_thread_id: m.message_thread_id }),
    text,
    parse_mode: "HTML",
    reply_parameters: { message_id: m.message_id, allow_sending_without_reply: true },
  });
}

async function handleMessage(m: TgMessage): Promise<void> {
  const text = m.text?.trim() ?? "";
  const isGroup = m.chat.type === "group" || m.chat.type === "supergroup";

  // "/connect CODE" or "/connect@bot CODE"
  const connect = text.match(/^\/connect(?:@\w+)?\s+([A-Za-z0-9]+)/);
  if (connect) {
    if (!isGroup) {
      await reply(m, "Команду /connect нужно отправить в группе, в теме, куда писать о бронях.");
      return;
    }
    const { data, error } = await db.rpc("telegram_connect", {
      p_code: connect[1],
      p_chat_id: m.chat.id,
      p_thread_id: m.is_topic_message ? (m.message_thread_id ?? null) : null,
      p_title: m.chat.title ?? null,
    });
    if (error) {
      console.error("telegram_connect failed", error);
      await reply(m, "Не получилось подключить чат, попробуйте ещё раз.");
    } else if (data === true) {
      await reply(m, "✅ Подключено. Сюда будут приходить брони и отмены студии.");
    } else {
      await reply(m, "Код не подошёл или устарел. Получите новый на сайте: Управление студией → Настройки.");
    }
    return;
  }

  if (!isGroup && text.startsWith("/start")) {
    await reply(
      m,
      `Это бот студии ALCYONA. Он пишет о бронях в чат группы.\nКалендарь студии: <a href="${SITE_URL}/studio">${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}/studio</a>`,
    );
  }
}

// ----- entry -----

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (!TOKEN) return json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not set" }, 500);

  const action = new URL(req.url).searchParams.get("action");
  if (action === "setup") return setup();
  if (action === "drain") return drain();

  if (req.headers.get("x-telegram-bot-api-secret-token") !== (await webhookSecret())) {
    return new Response("forbidden", { status: 403 });
  }
  try {
    const update = (await req.json()) as { message?: TgMessage };
    if (update.message) await handleMessage(update.message);
  } catch (e) {
    console.error("webhook failed", e);
  }
  // Always 200, otherwise Telegram keeps re-sending the same update
  return new Response("ok");
});
