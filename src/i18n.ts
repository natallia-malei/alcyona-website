import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ru: {
    translation: {
      nav: {
        home: "Главная",
        newAlbum: "Новый альбом",
        photos: "Фото",
        videos: "Видео",
        releases: "Релизы",
        booking: "Букинг",
        studio: "Студия",
      },
      hero: {
        listenNow: "Слушать сейчас",
      },
      telegram: {
        title: "Подпишись на наш Telegram",
        subtitle: "Анонсы концертов, релизов и закулисье",
        cta: "Подписаться",
      },
      photos: { title: "Фотографии" },
      videos: { title: "Видео" },
      releases: { title: "Альбомы и релизы", open: "Открыть" },
      booking: {
        title: "Букинг",
        subtitle: "По всем вопросам выступлений и сотрудничества",
      },
      footer: {
        rights: "© 2026, ALCYONA. All Rights Reserved.",
        privacy: "Политика конфиденциальности",
      },
      studio: { title: "Студия ALCYONA" },
      privacy: { title: "Политика конфиденциальности" },
      admin: { title: "Админ-панель" },
      release: { tracks: "Треки", lyrics: "Текст", back: "Назад к релизам" },
    },
  },
  en: {
    translation: {
      nav: {
        home: "Home",
        newAlbum: "New Album",
        photos: "Photos",
        videos: "Videos",
        releases: "Releases",
        booking: "Booking",
        studio: "Studio",
      },
      hero: {
        listenNow: "Listen now",
      },
      telegram: {
        title: "Join our Telegram",
        subtitle: "Concert announcements, releases, and behind the scenes",
        cta: "Subscribe",
      },
      photos: { title: "Photos" },
      videos: { title: "Videos" },
      releases: { title: "Albums & Releases", open: "Open" },
      booking: {
        title: "Booking",
        subtitle: "For all performance and collaboration inquiries",
      },
      footer: {
        rights: "© 2026, ALCYONA. All Rights Reserved.",
        privacy: "Privacy Policy",
      },
      studio: { title: "ALCYONA Studio" },
      privacy: { title: "Privacy Policy" },
      admin: { title: "Admin Panel" },
      release: { tracks: "Tracks", lyrics: "Lyrics", back: "Back to releases" },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ru",
  fallbackLng: "ru",
  interpolation: { escapeValue: false },
});

export default i18n;
