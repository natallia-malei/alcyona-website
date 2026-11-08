import type { StudioSettings } from "../../../types";

// Settings form state and the client-side copy of the studio_settings CHECKs (011)

export type SettingsField = keyof StudioSettings;
export type SettingsForm = Record<SettingsField, string>; // raw input text
export type SettingsGroupId = "hours" | "bookings" | "requests" | "trust";
// Keys under studio.manage.settings.invalid.*
export type SettingsMessage = "hours" | "duration" | "maxDuration" | "positive" | "nonNegative";

export const SETTINGS_GROUPS: readonly { id: SettingsGroupId; fields: readonly SettingsField[] }[] =
  [
    { id: "hours", fields: ["openHour", "closeHour"] },
    {
      id: "bookings",
      fields: ["minBookingHours", "maxBookingHours", "bookingHorizonWeeks", "maxActiveBookings"],
    },
    { id: "requests", fields: ["requestTtlHours", "requestCutoffHours"] },
    { id: "trust", fields: ["freeCancelHours", "noShowLimit"] },
  ];

const FIELDS = SETTINGS_GROUPS.flatMap((g) => g.fields);

export function toForm(settings: StudioSettings): SettingsForm {
  return Object.fromEntries(FIELDS.map((f) => [f, String(settings[f])])) as SettingsForm;
}

// Whole numbers only; "", "1.5", "1e2" → null
function parseInteger(raw: string): number | null {
  const s = raw.trim();
  return /^-?\d+$/.test(s) ? Number(s) : null;
}

export function settingsChanged(form: SettingsForm, loaded: StudioSettings): boolean {
  return FIELDS.some((f) => parseInteger(form[f]) !== loaded[f]);
}

export interface SettingsValidation {
  values: StudioSettings | null; // null while some field isn't a whole number
  groupErrors: Partial<Record<SettingsGroupId, SettingsMessage[]>>;
  invalidFields: Set<SettingsField>;
}

export function validateSettings(form: SettingsForm): SettingsValidation {
  const n = Object.fromEntries(FIELDS.map((f) => [f, parseInteger(form[f])])) as Record<
    SettingsField,
    number | null
  >;
  const groupErrors: SettingsValidation["groupErrors"] = {};
  const invalidFields = new Set<SettingsField>();

  // Highlight the empty / non-integer fields of a failed rule, or all of them
  const fail = (group: SettingsGroupId, message: SettingsMessage, fields: SettingsField[]) => {
    const list = (groupErrors[group] ??= []);
    if (!list.includes(message)) list.push(message);
    const blank = fields.filter((f) => n[f] === null);
    for (const f of blank.length > 0 ? blank : fields) invalidFields.add(f);
  };
  const atLeast = (group: SettingsGroupId, field: SettingsField, min: 0 | 1) => {
    const v = n[field];
    if (v === null || v < min) fail(group, min === 1 ? "positive" : "nonNegative", [field]);
  };

  const { openHour: open, closeHour: close, minBookingHours: min, maxBookingHours: max } = n;

  // 0 <= open < close <= 24
  const hoursOk = open !== null && close !== null && open >= 0 && open < close && close <= 24;
  if (!hoursOk) fail("hours", "hours", ["openHour", "closeHour"]);

  // 1 <= min <= max <= working day
  if (min === null || max === null || min < 1 || min > max) {
    fail("bookings", "duration", ["minBookingHours", "maxBookingHours"]);
  } else if (hoursOk && max > close - open) {
    fail("bookings", "maxDuration", ["maxBookingHours"]);
  }

  atLeast("bookings", "bookingHorizonWeeks", 1);
  atLeast("bookings", "maxActiveBookings", 1);
  atLeast("requests", "requestTtlHours", 1);
  atLeast("requests", "requestCutoffHours", 0);
  atLeast("trust", "freeCancelHours", 0);
  atLeast("trust", "noShowLimit", 1);

  const values = FIELDS.every((f) => n[f] !== null) ? (n as StudioSettings) : null;
  return { values, groupErrors, invalidFields };
}
