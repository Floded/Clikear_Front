export type AppMode = "online" | "offline";

export interface DesktopInfo {
  version: string;
  platform: string;
  backendUrl?: string;
  mode: AppMode;
  remoteUrl: string;
}

export interface DesktopApi {
  platform: string;
  getAppInfo: () => Promise<DesktopInfo>;
  getMode: () => Promise<AppMode>;
  setMode: (mode: AppMode) => Promise<AppMode>;
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && window.desktop !== undefined;
}

export async function getDesktopInfo(): Promise<DesktopInfo | null> {
  if (!isDesktop()) return null;
  return window.desktop!.getAppInfo();
}

export async function setDesktopMode(mode: AppMode): Promise<AppMode> {
  if (!isDesktop()) return mode;
  return window.desktop!.setMode(mode);
}
