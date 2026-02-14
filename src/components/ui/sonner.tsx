import { Toaster as Sonner } from "sonner";
import { useUserPreferences } from "@/hooks/useUserPreferences";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps): JSX.Element {
  const { preferences } = useUserPreferences();

  // Map our app's theme preference to Sonner's expected values
  // Sonner accepts: 'light' | 'dark' | 'system'
  const theme =
    preferences.theme === "light" || preferences.theme === "dark"
      ? preferences.theme
      : "system";

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      richColors
      position="bottom-right"
      {...props}
    />
  );
}
