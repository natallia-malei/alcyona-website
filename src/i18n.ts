import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

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
        menuOpen: "Открыть меню",
        menuClose: "Закрыть меню",
      },
      hero: {
        listenNow: "Слушать сейчас",
      },
      telegram: {
        title: "Подпишись на наш Telegram",
        subtitle: "Анонсы концертов, релизов и закулисье",
        cta: "Подписаться",
        editTitle: "Редактировать Telegram-канал",
      },
      photos: {
        title: "Фотографии",
        addPhoto: "Добавить фото",
        deleteConfirm: "Удалить эту фотографию?",
        empty: "Пока нет фотографий",
      },
      videos: {
        title: "Видео",
        addVideo: "Добавить видео",
        deleteConfirm: "Удалить это видео?",
        empty: "Пока нет видео",
        youtubeChannel: "YouTube канал",
        dragHandle: "Переместить",
      },
      releases: {
        title: "Альбомы и релизы",
        open: "Открыть",
        addRelease: "Добавить релиз",
        editRelease: "Редактировать релиз",
        deleteConfirm: "Удалить этот релиз?",
        dragHandle: "Переместить",
        empty: "Пока нет релизов",
      },
      booking: {
        title: "Букинг",
        subtitle: "По всем вопросам выступлений и сотрудничества",
        editTitle: "Редактировать контакты",
      },
      footer: {
        rights: "© 2026, ALCYONA. All Rights Reserved.",
        privacy: "Политика конфиденциальности",
      },
      studio: {
        title: "Студия ALCYONA",
        content:
          "Здесь будет описание студии группы ALCYONA: оборудование, услуги записи, фотографии помещения, контакты.",
      },
      privacy: {
        title: "Политика конфиденциальности",
        paragraph1:
          "Сайт ALCYONA не собирает персональные данные посетителей за исключением информации, добровольно предоставляемой через формы обратной связи.",
        paragraph2:
          "Используются только технические cookies, необходимые для работы сайта. Аналитические системы и трекеры не подключены.",
        contactPrefix: "По вопросам обработки персональных данных пишите на ",
      },
      release: { tracks: "Треки", lyrics: "Текст", back: "Назад" },
      notFound: { title: "Страница не найдена", home: "На главную" },
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
        menuOpen: "Open menu",
        menuClose: "Close menu",
      },
      hero: {
        listenNow: "Listen now",
      },
      telegram: {
        title: "Join our Telegram",
        subtitle: "Concert announcements, releases, and behind the scenes",
        cta: "Subscribe",
        editTitle: "Edit Telegram channel",
      },
      photos: {
        title: "Photos",
        addPhoto: "Add photo",
        deleteConfirm: "Delete this photo?",
        empty: "No photos yet",
      },
      videos: {
        title: "Videos",
        addVideo: "Add video",
        deleteConfirm: "Delete this video?",
        empty: "No videos yet",
        youtubeChannel: "YouTube channel",
        dragHandle: "Drag to reorder",
      },
      releases: {
        title: "Albums & Releases",
        open: "Open",
        addRelease: "Add release",
        editRelease: "Edit release",
        deleteConfirm: "Delete this release?",
        dragHandle: "Drag to reorder",
        empty: "No releases yet",
      },
      booking: {
        title: "Booking",
        subtitle: "For all performance and collaboration inquiries",
        editTitle: "Edit booking contacts",
      },
      footer: {
        rights: "© 2026, ALCYONA. All Rights Reserved.",
        privacy: "Privacy Policy",
      },
      studio: {
        title: "ALCYONA Studio",
        content:
          "Description of the ALCYONA studio will be placed here: equipment, recording services, photos, contacts.",
      },
      privacy: {
        title: "Privacy Policy",
        paragraph1:
          "The ALCYONA website does not collect personal data of visitors, except for information voluntarily provided through contact forms.",
        paragraph2:
          "Only technical cookies essential for the site to function are used. No analytics systems or trackers are connected.",
        contactPrefix: "For questions about personal data processing, write to ",
      },
      release: { tracks: "Tracks", lyrics: "Lyrics", back: "Back" },
      notFound: { title: "Page not found", home: "Go home" },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "ru"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "alcyona:locale",
    },
  });

export default i18n;
