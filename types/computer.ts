export interface ComputerConfig {
  os: "windows" | "macos" | "linux";
  arch: string;
  hostname: string;
}

export interface WindowState {
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
}
