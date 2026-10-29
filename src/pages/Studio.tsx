import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { isProfileReady, useAuthLoading, useIsAuthenticated, useProfile } from "../auth/hooks";
import { loginPath } from "../auth/redirect";
import { useStudioCalendar } from "../hooks/useStudioCalendar";
import { useToast } from "../hooks/useToast";
import type { MyBooking, StudioSettings } from "../types";
import {
  addDays,
  bookableDays,
  dayAvailability,
  dayKeyOf,
  reasonText,
  unavailableReason,
  type DayKey,
  type HourSlot,
} from "../utils/studioTime";
import { PageTitle } from "../components/ui/PageTitle";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";
import { Page } from "../components/layout/Page";
import { Stack } from "../components/layout/Stack";
import { Lead } from "../components/ui/Lead";
import { ProfileModal } from "../components/auth/ProfileModal";
import { DateStrip } from "../components/studio/DateStrip";
import { DayHours } from "../components/studio/DayHours";
import { WeekGrid } from "../components/studio/WeekGrid";
import { BookingSheet } from "../components/studio/BookingSheet";
import { MyBookings } from "../components/studio/MyBookings";
import { MyBookingsSummary } from "../components/studio/MyBookingsSummary";
import { CalendarSkeleton } from "../components/studio/CalendarSkeleton";
import { typography } from "../styles/typography";

const STUDIO_PATH = "/studio";

// Why the viewer can't book yet (null = can book)
type Gate = "guest" | "profile" | "blocked" | null;

export function Studio() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const toast = useToast();
  const isAuth = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const profile = useProfile();
  const { data, error, viewer, slotContext, refresh } = useStudioCalendar();

  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [weekStart, setWeekStart] = useState<DayKey | null>(null);
  const [picked, setPicked] = useState<HourSlot | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // #my-bookings appears only after the data loads — the router's hash scroll runs too early
  const loaded = data !== null && !authLoading;
  useEffect(() => {
    if (loaded && hash === "#my-bookings") {
      document.getElementById("my-bookings")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loaded, hash]);

  // Scroll the just-created booking into view once the refreshed calendar has it.
  // Both views are mounted (one hidden by CSS) — pick the visible element.
  useEffect(() => {
    if (!highlightId) return;
    const el = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-booking="${highlightId}"]`),
    ).find((e) => e.offsetParent !== null);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, data]);

  const canBook = profile !== null && isProfileReady(profile);
  const gate: Gate = !isAuth ? "guest" : profile?.blocked ? "blocked" : canBook ? null : "profile";

  const handlePick = (slot: HourSlot) => {
    if (gate === "guest") navigate(loginPath(STUDIO_PATH));
    else if (gate === "profile") setIsProfileOpen(true);
    else if (gate === "blocked") toast.error(t("studio.gate.blocked"));
    else setPicked(slot);
  };

  const handleExplain = (slot: HourSlot) => {
    const reason = slotContext && unavailableReason(slot, slotContext);
    if (reason) toast.info(reasonText(reason, slotContext, t, "hint"));
  };

  const handleBooked = (created?: MyBooking) => {
    void refresh();
    if (!created) return;
    setHighlightId(created.id);
    window.setTimeout(() => setHighlightId((id) => (id === created.id ? null : id)), 4000);
  };

  const scrollToCalendar = () =>
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });

  const renderCalendar = () => {
    if (!data && error) {
      return (
        <div className="space-y-4">
          <p className={typography.caption}>{t("studio.calendar.loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            {t("studio.calendar.retry")}
          </Button>
        </div>
      );
    }
    if (!data || !slotContext || authLoading) {
      return <CalendarSkeleton />;
    }

    const today = dayKeyOf(data.now);
    const days = bookableDays(today, data.settings);
    const day = selectedDay && days.includes(selectedDay) ? selectedDay : today;
    const week = weekStart ?? data.from;
    const availability = Object.fromEntries(days.map((d) => [d, dayAvailability(d, slotContext)]));

    return (
      <>
        <div className="md:hidden space-y-4">
          <p className={typography.caption}>{t("studio.calendar.timezone")}</p>
          <DateStrip
            days={days}
            selected={day}
            today={today}
            availability={availability}
            onSelect={setSelectedDay}
          />
          <DayHours
            day={day}
            ctx={slotContext}
            onPick={handlePick}
            onExplain={handleExplain}
            highlightId={highlightId}
          />
        </div>
        <div className="hidden md:block">
          <WeekGrid
            weekStart={week}
            today={today}
            ctx={slotContext}
            canGoPrev={week > data.from}
            canGoNext={addDays(week, 7) < data.to}
            onPrev={() => setWeekStart(addDays(week, -7))}
            onNext={() => setWeekStart(addDays(week, 7))}
            onPick={handlePick}
            onExplain={handleExplain}
            highlightId={highlightId}
          />
        </div>
      </>
    );
  };

  return (
    <Page size="lg">
      <Stack gap="xl">
        <Stack gap="lg">
          <PageTitle>{t("studio.title")}</PageTitle>
          <Lead>{t("studio.content")}</Lead>
        </Stack>

        <section id="booking" className="space-y-6">
          <SectionTitle size="sm">{t("studio.calendar.title")}</SectionTitle>
          {data && !authLoading && !viewer.isAdmin && (
            <BookingRules settings={data.settings} needsReview={!viewer.trusted} />
          )}
          {isAuth && data && !authLoading && (
            <MyBookingsSummary bookings={data.myBookings} now={data.now} />
          )}
          {!authLoading && gate && (
            <GateNotice gate={gate} onOpenProfile={() => setIsProfileOpen(true)} />
          )}
          {renderCalendar()}
        </section>

        {isAuth && data && !authLoading && (
          <section id="my-bookings">
            <MyBookings
              bookings={data.myBookings}
              settings={data.settings}
              now={data.now}
              isAdmin={viewer.isAdmin}
              onChanged={() => void refresh()}
              onEditProfile={() => setIsProfileOpen(true)}
              onPickTime={scrollToCalendar}
            />
          </section>
        )}
      </Stack>

      {slotContext && (
        <BookingSheet
          slot={picked}
          ctx={slotContext}
          onClose={() => setPicked(null)}
          onDone={handleBooked}
        />
      )}
      <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </Page>
  );
}

// The rules up front, so people don't learn them from error messages
function BookingRules({
  settings,
  needsReview,
}: {
  settings: StudioSettings;
  needsReview: boolean; // guest or not-yet-trusted client: bookings are requests
}) {
  const { t } = useTranslation();

  return (
    <div className={`space-y-1 ${typography.caption}`}>
      <p>
        {t("studio.calendar.rules", {
          min: settings.minBookingHours,
          max: settings.maxBookingHours,
          limit: settings.maxActiveBookings,
          cancel: settings.freeCancelHours,
        })}
      </p>
      {needsReview && (
        <p>{t("studio.calendar.rulesRequest", { count: settings.requestTtlHours })}</p>
      )}
    </div>
  );
}

interface GateNoticeProps {
  gate: Exclude<Gate, null>;
  onOpenProfile: () => void;
}

function GateNotice({ gate, onOpenProfile }: GateNoticeProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-white/10 rounded-sm">
      <p className="text-sm">
        {t(
          gate === "guest"
            ? "studio.gate.signIn"
            : gate === "profile"
              ? "studio.gate.completeProfile"
              : "studio.gate.blocked",
        )}
      </p>
      {gate === "guest" && (
        <Button size="sm" to={loginPath(STUDIO_PATH)} className="shrink-0">
          {t("auth.signIn")}
        </Button>
      )}
      {gate === "profile" && (
        <Button size="sm" onClick={onOpenProfile} className="shrink-0">
          {t("studio.gate.completeProfileAction")}
        </Button>
      )}
    </div>
  );
}
