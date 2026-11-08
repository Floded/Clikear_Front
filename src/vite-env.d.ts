/// <reference types="vite/client" />

import type { DesktopApi } from "@/lib/desktop";

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    desktop?: DesktopApi;
  }
}
