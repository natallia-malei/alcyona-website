import { useTranslation } from "react-i18next";
import type { StudioClient } from "../../../types";
import { clientBadge } from "../../../utils/studioManage";
import { typography } from "../../../styles/typography";

const badgeClass = {
  admin: "border-accent/60 text-accent",
  trusted: "border-accent/40 text-accent",
  newbie: "border-amber-400/50 text-amber-400",
  blocked: "border-red-500/60 text-red-400",
} as const;

// Admin / Trusted / Newbie / Blocked
export function ClientBadge({
  client,
}: {
  client: Pick<StudioClient, "role" | "trusted" | "blocked">;
}) {
  const { t } = useTranslation();
  const badge = clientBadge(client);

  return (
    <span
      className={`inline-block px-2 py-0.5 border rounded-sm ${typography.eyebrowXs} text-[10px] ${badgeClass[badge]}`}
    >
      {t(`studio.manage.badge.${badge}`)}
    </span>
  );
}
