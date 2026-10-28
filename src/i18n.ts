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
      // Placeholders in [brackets] — to be filled in by the site owner
      privacy: {
        title: "Политика конфиденциальности",
        sections: [
          {
            title: "Кто обрабатывает данные",
            paragraphs: [
              "Оператор персональных данных — [ФИО или название], [адрес / УНП, если есть].",
            ],
          },
          {
            title: "Посетители сайта",
            paragraphs: [
              "Просматривать сайт можно без регистрации — в этом случае мы не собираем персональные данные. Аналитика и трекеры не подключены.",
            ],
          },
          {
            title: "Клиенты студии",
            paragraphs: [
              "Чтобы бронировать студию, нужно войти на сайт и заполнить профиль. Мы обрабатываем:",
            ],
            items: [
              "email, с которым вы входите (при входе через Google — также имя, фамилию и фото из аккаунта Google);",
              "имя, фамилию и телефон;",
              "ник в Telegram, если вы его указали;",
              "данные о бронированиях: дату и время, описание «что будем делать», отметки о посещении.",
            ],
          },
          {
            title: "Зачем",
            paragraphs: [
              "Чтобы принимать и подтверждать брони, связываться с вами по поводу брони и не допускать накладок в расписании.",
            ],
          },
          {
            title: "Кто видит",
            paragraphs: [
              "Все данные профиля видит администратор студии. Другие вошедшие пользователи видят в календаре ваши имя и фамилию, только если вы включили это в профиле, — иначе «Занято». Описание брони видите только вы и администратор. Мы не передаём данные третьим лицам и не используем их для рекламы.",
            ],
          },
          {
            title: "Где хранятся",
            paragraphs: ["В облачной базе данных Supabase (серверы в [регион])."],
          },
          {
            title: "Сколько хранятся",
            paragraphs: [
              "Пока существует ваш аккаунт. После удаления аккаунта профиль удаляется, будущие брони отменяются, а прошедшие остаются в истории студии без имени.",
            ],
          },
          {
            title: "Ваши права",
            paragraphs: [
              "Вы можете в любой момент изменить данные в профиле, запросить информацию о том, какие данные мы храним, отозвать согласие и потребовать удалить аккаунт — напишите нам на почту ниже. Без согласия бронирование через сайт недоступно.",
            ],
          },
          {
            title: "Cookies и хранилище браузера",
            paragraphs: [
              "Сайт использует только то, что нужно для работы: сохраняет вход в аккаунт и выбранный язык.",
            ],
          },
        ],
        contactPrefix: "По вопросам обработки персональных данных пишите на ",
      },
      release: { tracks: "Треки", lyrics: "Текст", back: "Назад" },
      notFound: { title: "Страница не найдена", home: "На главную" },
      auth: {
        signIn: "Войти",
        signOut: "Выйти",
        accountMenu: "Меню аккаунта",
        myBookings: "Мои брони",
        profile: "Профиль",
        email: "Email",
        password: "Пароль",
        showPassword: "Показать пароль",
        hidePassword: "Скрыть пароль",
        continueWithGoogle: "Войти через Google",
        or: "или",
        sendLink: "Получить ссылку для входа",
        linkSent:
          "Мы отправили ссылку для входа на {{email}}. Откройте письмо и перейдите по ссылке.",
        useAnotherEmail: "Указать другой email",
        usePassword: "Войти по паролю",
        useMagicLink: "Войти по ссылке из письма",
        signInFailed: "Не удалось войти",
      },
      profile: {
        title: "Заполните профиль",
        intro:
          "Профиль нужен для бронирования студии. Телефон и Telegram видит только администратор.",
        firstName: "Имя",
        lastName: "Фамилия",
        phone: "Телефон",
        telegram: "Ник в Telegram (необязательно)",
        showFullName: "Показывать моё имя и фамилию в календаре студии другим участникам",
        invalidPhone: "Проверьте номер телефона",
        invalidTelegram: "Ник в Telegram: 5–32 символа — латиница, цифры и _",
        later: "Позже",
        saved: "Профиль сохранён",
        editTitle: "Профиль",
        consentPrefix: "Я согласен(на) на обработку моих персональных данных в соответствии с ",
        consentLink: "Политикой конфиденциальности",
        consentRequired:
          "Чтобы бронировать студию, нужно согласие на обработку персональных данных",
      },
      app: {
        loading: "Загрузка…",
        errorTitle: "Не удалось загрузить данные",
      },
      common: {
        cancel: "Отмена",
        confirm: "Подтвердить",
        save: "Сохранить",
        add: "Добавить",
        saving: "Сохранение…",
        saveFailed: "Не удалось сохранить",
        deleteFailed: "Не удалось удалить",
        reorderFailed: "Не удалось изменить порядок",
        unknownError: "Неизвестная ошибка",
      },
      admin: {
        photoLabel: "Фото",
        imageUpload: "Загрузить изображение",
        imageUploading: "Загрузка…",
        imageNone: "Нет изображения",
        imageFileHint: "JPG, PNG, GIF, WebP, SVG — до 50 МБ",
        imagePasteUrl: "…или вставьте URL изображения",
        imageUploadFailed: "Не удалось загрузить файл",
        videoUrl: "URL YouTube",
        videoUrlInvalid: "Некорректный URL YouTube",
        videoIdDetected: "Определён ID:",
        videoFetching: "Получаем информацию о видео…",
        videoTitle: "Название",
        videoTitleRequired: "Название обязательно на RU и EN",
        videoAddFailed: "Не удалось добавить видео",
        videoMetaFailed: "Не удалось получить данные видео",
        releaseTitle: "Название",
        releaseType: "Тип",
        releaseTypeAlbum: "Альбом",
        releaseTypeSingle: "Сингл",
        releaseTypeEp: "EP",
        releaseDate: "Дата релиза",
        releaseCover: "Обложка",
        releaseDescription: "Описание",
        streamingLinks: "Ссылки на стриминги",
        tracksCount: "Треки ({{count}})",
        addTrack: "Добавить трек",
        trackDuration: "Длительность",
        trackShowLyrics: "Текст",
        trackHideLyrics: "Скрыть текст",
        trackDelete: "Удалить трек",
        trackDragHandle: "Переместить",
        trackLyricsLabel: "Текст",
        bookingEmail: "Email для букинга",
        socialLinks: "Соцсети",
        telegramUrl: "URL Telegram-канала",
      },
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
        sections: [
          {
            title: "Who processes your data",
            paragraphs: [
              "The personal data controller is [full name or company name], [address / registration number, if any].",
            ],
          },
          {
            title: "Website visitors",
            paragraphs: [
              "You can browse the site without signing up — in that case we collect no personal data. No analytics or trackers are connected.",
            ],
          },
          {
            title: "Studio clients",
            paragraphs: [
              "To book the studio you need to sign in and fill in your profile. We process:",
            ],
            items: [
              "the email you sign in with (with Google sign-in — also the name, surname and photo from your Google account);",
              "your first name, last name and phone number;",
              "your Telegram username, if you provided it;",
              "booking details: date and time, the “what we'll do” description, attendance marks.",
            ],
          },
          {
            title: "Why",
            paragraphs: [
              "To accept and confirm bookings, contact you about them and avoid schedule conflicts.",
            ],
          },
          {
            title: "Who can see it",
            paragraphs: [
              "The studio admin sees all profile data. Other signed-in users see your name in the calendar only if you enabled it in your profile — otherwise “Busy”. The booking description is visible only to you and the admin. We do not share your data with third parties or use it for advertising.",
            ],
          },
          {
            title: "Where it is stored",
            paragraphs: ["In the Supabase cloud database (servers in [region])."],
          },
          {
            title: "How long it is kept",
            paragraphs: [
              "As long as your account exists. When the account is deleted, the profile is removed, future bookings are cancelled, and past ones stay in the studio history without your name.",
            ],
          },
          {
            title: "Your rights",
            paragraphs: [
              "You can change your profile at any time, ask what data we store, withdraw your consent and request account deletion — write to the email below. Without consent, booking through the site is not available.",
            ],
          },
          {
            title: "Cookies and browser storage",
            paragraphs: [
              "The site stores only what it needs to work: your sign-in session and chosen language.",
            ],
          },
        ],
        contactPrefix: "For questions about personal data processing, write to ",
      },
      release: { tracks: "Tracks", lyrics: "Lyrics", back: "Back" },
      notFound: { title: "Page not found", home: "Go home" },
      auth: {
        signIn: "Sign in",
        signOut: "Sign out",
        accountMenu: "Account menu",
        myBookings: "My bookings",
        profile: "Profile",
        email: "Email",
        password: "Password",
        showPassword: "Show password",
        hidePassword: "Hide password",
        continueWithGoogle: "Continue with Google",
        or: "or",
        sendLink: "Email me a sign-in link",
        linkSent: "We sent a sign-in link to {{email}}. Open the email and follow the link.",
        useAnotherEmail: "Use another email",
        usePassword: "Sign in with password",
        useMagicLink: "Sign in with email link",
        signInFailed: "Sign in failed",
      },
      profile: {
        title: "Complete your profile",
        intro:
          "Your profile is needed to book the studio. Only the admin sees your phone and Telegram.",
        firstName: "First name",
        lastName: "Last name",
        phone: "Phone",
        telegram: "Telegram username (optional)",
        showFullName: "Show my first and last name to other members in the studio calendar",
        invalidPhone: "Please check the phone number",
        invalidTelegram: "Telegram username: 5–32 characters — Latin letters, digits and _",
        later: "Later",
        saved: "Profile saved",
        editTitle: "Profile",
        consentPrefix: "I agree to the processing of my personal data in accordance with the ",
        consentLink: "Privacy Policy",
        consentRequired: "Consent to personal data processing is required to book the studio",
      },
      app: {
        loading: "Loading…",
        errorTitle: "Could not load data",
      },
      common: {
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        add: "Add",
        saving: "Saving…",
        saveFailed: "Failed to save",
        deleteFailed: "Failed to delete",
        reorderFailed: "Failed to reorder",
        unknownError: "Unknown error",
      },
      admin: {
        photoLabel: "Photo",
        imageUpload: "Upload new image",
        imageUploading: "Uploading…",
        imageNone: "No image",
        imageFileHint: "JPG, PNG, GIF, WebP, SVG — up to 50 MB",
        imagePasteUrl: "…or paste image URL directly",
        imageUploadFailed: "Upload failed",
        videoUrl: "YouTube URL",
        videoUrlInvalid: "Invalid YouTube URL",
        videoIdDetected: "Detected video ID:",
        videoFetching: "Fetching video info…",
        videoTitle: "Title",
        videoTitleRequired: "Title required in both RU and EN",
        videoAddFailed: "Failed to add video",
        videoMetaFailed: "Failed to fetch video metadata",
        releaseTitle: "Title",
        releaseType: "Type",
        releaseTypeAlbum: "Album",
        releaseTypeSingle: "Single",
        releaseTypeEp: "EP",
        releaseDate: "Release date",
        releaseCover: "Cover",
        releaseDescription: "Description",
        streamingLinks: "Streaming links",
        tracksCount: "Tracks ({{count}})",
        addTrack: "Add track",
        trackDuration: "Duration",
        trackShowLyrics: "Lyrics",
        trackHideLyrics: "Hide lyrics",
        trackDelete: "Delete track",
        trackDragHandle: "Drag to reorder",
        trackLyricsLabel: "Lyrics",
        bookingEmail: "Booking email",
        socialLinks: "Social links",
        telegramUrl: "Telegram channel URL",
      },
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
