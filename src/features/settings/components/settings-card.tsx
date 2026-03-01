import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  actions,
}: SettingsCardProps): React.ReactNode {
  return (
    <Card className={cn(className)}>
      <CardHeader className="border-b border-border-primary bg-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg">
                <Icon className="h-5 w-5 text-teal-600" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-text-heading">{title}</h3>
              {description && (
                <p className="text-sm text-text-tertiary">{description}</p>
              )}
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  showOptionalLabel?: boolean;
}

export function SettingsRow({
  label,
  description,
  children,
  className,
  required,
  showOptionalLabel,
}: SettingsRowProps): React.ReactNode {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-4 border-b border-border-primary last:border-0",
        className
      )}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
          {!required && showOptionalLabel && (
            <span className="text-text-tertiary text-xs ml-1">(Optional)</span>
          )}
        </p>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

interface SettingsGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsGroup({
  title,
  children,
  className,
}: SettingsGroupProps): React.ReactNode {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {title}
        </h4>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}
