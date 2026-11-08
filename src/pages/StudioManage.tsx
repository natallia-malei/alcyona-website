import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuthLoading, useIsAdmin, useIsAuthenticated } from "../auth/hooks";
import { loginPath } from "../auth/redirect";
import { fetchPendingRequests } from "../supabase/manage";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { PageTitle } from "../components/ui/PageTitle";
import { BackLink } from "../components/ui/BackLink";
import { CalendarSkeleton } from "../components/studio/CalendarSkeleton";
import {
  isManageTab,
  MANAGE_PATH,
  MANAGE_TABS,
  type ManageTab,
} from "../components/studio/manage/manageLinks";
import { RequestsTab } from "../components/studio/manage/RequestsTab";
import { CalendarTab } from "../components/studio/manage/CalendarTab";
import { ClientsTab } from "../components/studio/manage/ClientsTab";
import { SettingsTab } from "../components/studio/manage/SettingsTab";
import { typography } from "../styles/typography";

// /studio/manage — admin only. Guests go to sign-in, clients back to /studio.
// The database checks is_admin() on every call anyway; this only hides the page.
export function StudioManage() {
  const isAuth = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const authLoading = useAuthLoading();

  if (authLoading) {
    return (
      <Page size="lg">
        <CalendarSkeleton />
      </Page>
    );
  }
  if (!isAuth) return <Navigate to={loginPath(MANAGE_PATH)} replace />;
  if (!isAdmin) return <Navigate to="/studio" replace />;
  return <ManagePanel />;
}

function ManagePanel() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const rawTab = params.get("tab");
  const tab: ManageTab = isManageTab(rawTab) ? rawTab : "requests";
  const focusClientId = params.get("client");

  // Number on the "Requests" tab: loaded here so it shows on every tab,
  // then kept fresh by the tabs that change requests (onPendingCount)
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const loadPendingCount = useCallback(() => {
    fetchPendingRequests().then(
      (list) => setPendingCount(list.length),
      (e: unknown) => console.error("Failed to load requests count", e),
    );
  }, []);
  useEffect(() => {
    loadPendingCount();
    window.addEventListener("focus", loadPendingCount);
    return () => window.removeEventListener("focus", loadPendingCount);
  }, [loadPendingCount]);

  const selectTab = (next: ManageTab) => setParams({ tab: next });

  return (
    <Page size="lg">
      <Stack gap="lg">
        <Stack gap="md">
          <BackLink fallback="/studio">{t("studio.manage.backToStudio")}</BackLink>
          <PageTitle>{t("studio.manage.title")}</PageTitle>
        </Stack>

        <div
          role="tablist"
          aria-label={t("studio.manage.title")}
          className="flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] border-b border-white/10 -mx-4 px-4 md:mx-0 md:px-0"
        >
          {MANAGE_TABS.map((id) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`manage-tab-${id}`}
                aria-selected={active}
                aria-controls={`manage-panel-${id}`}
                onClick={() => selectTab(id)}
                className={`shrink-0 flex items-center gap-2 px-3 md:px-4 py-3 -mb-px border-b-2 ${typography.eyebrowXs} transition-colors ${
                  active
                    ? "border-accent text-white"
                    : "border-transparent text-fg-muted hover:text-white"
                }`}
              >
                {t(`studio.manage.tabs.${id}`)}
                {id === "requests" && pendingCount !== null && pendingCount > 0 && (
                  <span className="min-w-5 px-1.5 rounded-full bg-amber-400 text-black text-[11px] leading-5 text-center tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`manage-panel-${tab}`} aria-labelledby={`manage-tab-${tab}`}>
          {tab === "requests" && <RequestsTab onPendingCount={setPendingCount} />}
          {tab === "calendar" && <CalendarTab onRequestsChanged={loadPendingCount} />}
          {tab === "clients" && <ClientsTab focusClientId={focusClientId} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </Stack>
    </Page>
  );
}
