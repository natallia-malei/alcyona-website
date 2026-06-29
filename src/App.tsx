import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./components/shell/Header";
import { Footer } from "./components/shell/Footer";
import { useScrollOnRouteChange } from "./hooks/useScrollOnRouteChange";
import { useStorageError, useStorageLoading } from "./storage/hooks";

export default function App() {
  const { i18n } = useTranslation();
  useScrollOnRouteChange();
  const loading = useStorageLoading();
  const error = useStorageError();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-fg-muted">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-fg-muted text-center max-w-md">
          Не удалось загрузить данные: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
