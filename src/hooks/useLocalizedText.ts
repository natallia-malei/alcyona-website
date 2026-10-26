import { useTranslation } from "react-i18next";
import type { Locale, LocalizedText } from "../types";

export function useLocalizedText() {
  const { i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  // Prefer target locale, but skip empty strings ("" falls through to fallback).
  return (text: LocalizedText) => text[locale] || text.ru || text.en || "";
}
