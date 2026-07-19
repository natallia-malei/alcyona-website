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
      { path: "login", Component: Login },
      { path: "*", Component: NotFound },
    ],
  },
]);
