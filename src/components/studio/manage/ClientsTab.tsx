import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StudioClient } from "../../../types";
import { fetchClients } from "../../../supabase/manage";
import { fetchStudioSettings } from "../../../supabase/bookings";
import { clientBadge, matchesClient } from "../../../utils/studioManage";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";
import { ClientsCard } from "./ClientsCard";
import type { ClientHistory } from "./ClientsHistory";

export interface ClientsTabProps {
  focusClientId: string | null; // ?client=… — open and scroll to this client's card
}

const FILTERS = ["all", "trusted", "newbies", "blocked"] as const;
type ClientFilter = (typeof FILTERS)[number];

// Filter chip → badge it shows; admins only appear under "all"
const FILTER_BADGE = { trusted: "trusted", newbies: "newbie", blocked: "blocked" } as const;

const HIGHLIGHT_MS = 3000;

function matchesFilter(c: StudioClient, filter: ClientFilter): boolean {
  return filter === "all" || clientBadge(c) === FILTER_BADGE[filter];
}

interface ClientsData {
  clients: StudioClient[];
  noShowLimit: number;
  version: number; // bumps on every load — open histories refetch with it
}

export function ClientsTab({ focusClientId }: ClientsTabProps) {
  const { t } = useTranslation();

  const [data, setData] = useState<ClientsData | null>(null);
  const [error, setError] = useState<unknown>(null);
  const requestId = useRef(0);

  // No realtime: reload after each action and when the window gets focus
  const load = useCallback(() => {
    const id = ++requestId.current;
    return Promise.all([fetchClients(), fetchStudioSettings()]).then(
      ([clients, settings]) => {
        // A newer load started meanwhile — only its result counts
        if (id !== requestId.current) return;
        setData({ clients, noShowLimit: settings.noShowLimit, version: id });
        setError(null);
      },
      (e: unknown) => {
        if (id !== requestId.current) return;
        console.error("Failed to load clients", e);
        setError(e);
      },
    );
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [openHistory, setOpenHistory] = useState<ReadonlySet<string>>(() => new Set());
  const [histories, setHistories] = useState<Record<string, ClientHistory>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // ?client=… — once that client is loaded: clear filters, open its history, highlight.
  // Adjusting state during render (not in an effect) so the card mounts already open.
  const [handledFocus, setHandledFocus] = useState<string | null>(null);
  if (
    data &&
    focusClientId &&
    focusClientId !== handledFocus &&
    data.clients.some((c) => c.id === focusClientId)
  ) {
    setHandledFocus(focusClientId);
    setQuery("");
    setFilter("all");
    setOpenHistory((prev) => new Set(prev).add(focusClientId));
    setHighlightId(focusClientId);
  }

  // Scroll to the highlighted card, then fade the outline
  useEffect(() => {
    if (!highlightId) return;
    document
      .getElementById(clientCardId(highlightId))
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const toggleHistory = useCallback((id: string) => {
    setOpenHistory((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const handleHistoryLoaded = useCallback((id: string, history: ClientHistory) => {
    setHistories((prev) => ({ ...prev, [id]: history }));
  }, []);

  const counts = useMemo(() => {
    const all = data?.clients ?? [];
    return Object.fromEntries(
      FILTERS.map((f) => [f, all.filter((c) => matchesFilter(c, f)).length]),
    ) as Record<ClientFilter, number>;
  }, [data]);

  const visible = useMemo(
    () => data?.clients.filter((c) => matchesFilter(c, filter) && matchesClient(c, query)) ?? [],
    [data, filter, query],
  );

  if (!data) {
    return error ? (
      <LoadFailed
        onRetry={() => {
          setError(null);
          void load();
        }}
      />
    ) : (
      <ClientsSkeleton />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("studio.manage.clients.search")}
          aria-label={t("studio.manage.clients.search")}
          className="w-full md:max-w-sm px-3 py-2 bg-bg border border-white/20 rounded-sm text-white placeholder:text-fg-muted/70 focus:outline-none focus:border-accent transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 border rounded-sm ${typography.eyebrowXs} text-[11px] transition-colors ${
                  active
                    ? "border-accent bg-accent/15 text-white"
                    : "border-white/15 text-fg-muted hover:border-accent/60 hover:text-white"
                }`}
              >
                {t(`studio.manage.clients.filter.${f}`)}
                <span className="ml-1.5 tabular-nums opacity-70">{counts[f]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* A refresh failed — keep showing the last loaded list */}
      {error !== null && <LoadFailed onRetry={() => void load()} />}

      {data.clients.length === 0 ? (
        <p className={typography.caption}>{t("studio.manage.clients.empty")}</p>
      ) : visible.length === 0 ? (
        <p className={typography.caption}>{t("studio.manage.clients.notFound")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((c) => (
            <ClientsCard
              key={c.id}
              domId={clientCardId(c.id)}
              client={c}
              noShowLimit={data.noShowLimit}
              highlighted={c.id === highlightId}
              historyOpen={openHistory.has(c.id)}
              history={histories[c.id] ?? null}
              historyVersion={data.version}
              onToggleHistory={toggleHistory}
              onHistoryLoaded={handleHistoryLoaded}
              onChanged={load}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function clientCardId(id: string): string {
  return `manage-client-${id}`;
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p role="alert" className="text-sm text-red-400">
        {t("studio.manage.loadFailed")}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("studio.manage.retry")}
      </Button>
    </div>
  );
}

const block = "rounded-sm bg-white/5 animate-pulse";

function ClientsSkeleton() {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{t("app.loading")}</span>
      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
        <div className={`${block} h-10 w-full md:max-w-sm`} />
        <div className={`${block} h-8 w-72`} />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${block} h-32`} />
        ))}
      </div>
    </div>
  );
}
