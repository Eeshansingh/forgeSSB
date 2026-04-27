import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";
import posthog from 'posthog-js'

posthog.init('phc_yZbHJMyGfKMNeLR7Gggqcj4X52od62YjctTUaKVh5ncf', {
  api_host: 'https://app.posthog.com',
  capture_pageview: true,
  loaded: (posthog) => {
    if (import.meta.env.DEV) posthog.opt_out_capturing()
  }
})

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);