import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAccount, useAuthActions } from "../../auth/hooks";
import { Avatar } from "../ui/Avatar";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface UserMenuProps {
  onOpenProfile: () => void;
}

// Desktop: avatar in the header → dropdown with account actions
export function UserMenu({ onOpenProfile }: UserMenuProps) {
  const { t } = useTranslation();
  const account = useAccount();
  const { signOut } = useAuthActions();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!account) return null;

  const item = `block w-full text-left px-4 py-2 ${typography.eyebrowXs} ${interactive.mutedHover}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("auth.accountMenu")}
        aria-expanded={open}
        className="block rounded-full hover:ring-2 hover:ring-accent transition-shadow"
      >
        <Avatar imageUrl={account.avatarUrl} initials={account.initials} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-64 py-2 bg-bg-elevated border border-white/10 rounded-sm shadow-xl">
          <div className="px-4 pb-3 mb-2 border-b border-white/10">
            <p className="text-sm text-white truncate">{account.name}</p>
            {account.name !== account.email && (
              <p className={`${typography.caption} truncate`}>{account.email}</p>
            )}
          </div>
          <Link to="/studio#my-bookings" onClick={() => setOpen(false)} className={item}>
            {t("auth.myBookings")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className={item}
          >
            {t("auth.profile")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className={item}
          >
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
