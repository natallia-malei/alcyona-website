import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Landing } from "./pages/Landing";
import { ReleasePage } from "./pages/Release";
import { Studio } from "./pages/Studio";
import { Privacy } from "./pages/Privacy";
import { PhotosGallery } from "./pages/PhotosGallery";
import { VideosGallery } from "./pages/VideosGallery";
import { ReleasesGallery } from "./pages/ReleasesGallery";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  // /login is standalone: it doesn't need band/releases/etc. data,
  // so it renders without the App's storage-loading gate.
  { path: "/login", Component: Login },
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: Landing },
      { path: "release/:id", Component: ReleasePage },
      { path: "studio", Component: Studio },
      { path: "privacy", Component: Privacy },
      { path: "photos", Component: PhotosGallery },
      { path: "videos", Component: VideosGallery },
      { path: "releases", Component: ReleasesGallery },
      { path: "*", Component: NotFound },
    ],
  },
]);
