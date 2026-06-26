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
      admin: {
        title: "Админ-панель",
        note:
          "Данные хранятся в Local Storage этого браузера. Полноценные формы редактирования будут добавлены на следующем этапе.",
      },
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
      admin: {
        title: "Admin Panel",
        note:
          "Data is stored in this browser's Local Storage. Full editing forms will be added at the next stage.",
      },
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
