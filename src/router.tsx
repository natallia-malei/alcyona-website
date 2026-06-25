import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Landing } from "./pages/Landing";
import { ReleasePage } from "./pages/Release";
import { Studio } from "./pages/Studio";
import { Privacy } from "./pages/Privacy";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      { index: true, Component: Landing },
      { path: "release/:id", Component: ReleasePage },
      { path: "studio", Component: Studio },
      { path: "privacy", Component: Privacy },
      { path: "admin", Component: Admin },
    ],
  },
]);
