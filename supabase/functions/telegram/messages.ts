// Texts of the studio feed (Russian, HTML parse mode).
// One row of telegram_claim_notifications() → one message.

export interface QueuedNotification {
  id: number;
  kind:
    | "requested"
    | "booked"
    | "closed"
    | "approved"
    | "rejected"
    | "expired"
    | "cancelled"
    | "test";
  prev_status: string | null;
  by_owner: boolean;
  by_admin: boolean;
  starts_at: string | null;
  ends_at: string | null;
  purpose: string | null;
  label: string | null;
  guest_name: string | null;
  has_user: boolean;
  first_name: string | null;
  last_name: string | null;
  chat_id: number | null;
  thread_id: number | null;
}

export interface OutgoingMessage {
  text: string;
  silent: boolean; // disable_notification
}

const TZ = "Europe/Minsk";
const DAY_MS = 24 * 60 * 60 * 1000;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// "2026-11-13" in Minsk
function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function hhmm(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

// "сегодня, 18:00–20:00" / "завтра, 12:00–15:00" / "пт, 13 ноября, 10:00–14:00"
export function when(startsAt: Date, endsAt: Date, now = new Date()): string {
  const key = dayKey(startsAt);
  let day: string;
  if (key === dayKey(now)) day = "сегодня";
  else if (key === dayKey(new Date(now.getTime() + DAY_MS))) day = "завтра";
  else {
    day = new Intl.DateTimeFormat("ru-RU", {
      timeZone: TZ,
      weekday: "short",
      day: "numeric",
      month: "long",
    }).format(startsAt);
  }
  // A booking until midnight ends at "24:00", not "00:00"
  const end = hhmm(endsAt) === "00:00" && dayKey(endsAt) !== key ? "24:00" : hhmm(endsAt);
  return `${day}, ${hhmm(startsAt)}–${end}`;
}

// Whose booking: client's first name, guest's name, or "Удалённый пользователь"
function who(n: QueuedNotification): string {
  if (n.guest_name) return n.guest_name;
  if (!n.has_user) return "Удалённый пользователь";
  const name = (n.first_name ?? "").trim() || `${n.first_name ?? ""} ${n.last_name ?? ""}`.trim();
  return name || "Без имени";
}

export function buildMessage(n: QueuedNotification, siteUrl: string): OutgoingMessage | null {
  if (n.kind === "test") {
    return {
      text: "✅ Бот студии ALCYONA подключён. Сюда будут приходить брони и отмены.",
      silent: false,
    };
  }
  if (!n.starts_at || !n.ends_at) return null; // the booking was deleted meanwhile

  const time = `<b>${escapeHtml(when(new Date(n.starts_at), new Date(n.ends_at)))}</b>`;
  const name = `<b>${escapeHtml(who(n))}</b>`;
  const purpose = n.purpose ? `\n<i>${escapeHtml(n.purpose)}</i>` : "";
  const byAdmin = n.by_admin && !n.by_owner ? " (через админа)" : "";
  const isBlock = n.label !== null;
  const caption = n.label ? ` · ${escapeHtml(n.label)}` : "";

  switch (n.kind) {
    case "booked":
      return { text: `🎸 Бронь: ${name} — ${time}${byAdmin}${purpose}`, silent: true };
    case "closed":
      return { text: `🔒 Студия закрыта: ${time}${caption}`, silent: true };
    case "requested":
      return {
        text:
          `📝 Новая заявка: ${name} — ${time}${purpose}\n` +
          `Подтвердить: <a href="${siteUrl}/studio/manage">на сайте</a>`,
        silent: false,
      };
    case "approved":
      return { text: `✅ Заявка одобрена: ${name} — ${time}`, silent: true };
    case "rejected":
      return { text: `🚫 Заявка отклонена: ${name} — ${time}`, silent: true };
    case "expired":
      return { text: `⌛ Заявка не рассмотрена вовремя и сгорела: ${name} — ${time}`, silent: false };
    case "cancelled":
      if (isBlock) return { text: `🔓 Студия снова свободна: ${time}${caption}`, silent: true };
      if (n.prev_status === "pending") {
        return { text: `↩️ Заявка отозвана: ${name} — ${time}`, silent: true };
      }
      return { text: `❌ Отмена: ${name} — ${time}${byAdmin}`, silent: true };
  }
  return null;
}
