export interface MobileConfig {
  platform: "ios" | "android";
  version: string;
  deviceId?: string;
}

export interface MobileNavigation {
  currentScreen: string;
  params?: Record<string, unknown>;
}
