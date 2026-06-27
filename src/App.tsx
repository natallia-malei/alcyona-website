import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Header } from "./components/shell/Header";
import { Footer } from "./components/shell/Footer";
import { useScrollOnRouteChange } from "./hooks/useScrollOnRouteChange";

export default function App() {
  const { i18n } = useTranslation();
  useScrollOnRouteChange();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

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
