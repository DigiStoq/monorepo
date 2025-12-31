import { forwardRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: LucideIcon;
  /** Route path */
  href?: string;
  /** Nested items (creates expandable section) */
  children?: NavItem[];
  /** Badge content (e.g., count) */
  badge?: ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

export interface SidebarProps {
  /** Navigation items */
  items: NavItem[];
  /** Currently active item id */
  activeId?: string;
  /** Expanded section ids */
  expandedIds?: Set<string>;
  /** Toggle section expansion */
  onToggleExpand?: (id: string) => void;
  /** Check if link is active */
  isLinkActive?: (path: string) => boolean;
  /** Navigation callback */
  onNavigate?: (item: NavItem) => void;
  /** Collapsed state */
  isCollapsed?: boolean;
  /** Toggle collapsed state */
  onToggleCollapse?: () => void;
  /** Header content (logo, brand) */
  header?: ReactNode;
  /** Footer content (user profile, settings) */
  footer?: ReactNode;
  /** Additional class name */
  className?: string;
}

export interface SidebarItemProps {
  item: NavItem;
  isActive?: boolean;
  isExpanded?: boolean;
  isCollapsed?: boolean;
  depth?: number;
  onToggle?: () => void;
  onNavigate?: (item: NavItem) => void;
  activeId?: string;
}

// ============================================================================
// ANIMATIONS
// ============================================================================

const expandVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
} as const;

// ============================================================================
// SIDEBAR ITEM COMPONENT
// ============================================================================

function SidebarItem({
  item,
  isActive,
  isExpanded,
  isCollapsed,
  depth = 0,
  onToggle,
  onNavigate,
  activeId,
}: SidebarItemProps): ReactNode {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;
  const isNested = depth > 0;

  const handleClick = (): void => {
    if (hasChildren) {
      onToggle?.();
    } else {
      onNavigate?.(item);
    }
  };

  // Check if any child is active
  const hasActiveChild =
    hasChildren &&
    item.children?.some(
      (child) =>
        child.id === activeId || child.children?.some((c) => c.id === activeId)
    );

  return (
    <div>
      <button
        type="button"
        disabled={item.disabled}
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "text-sm font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
          isNested && "ml-4 w-[calc(100%-1rem)]",
          isActive || hasActiveChild
            ? "bg-primary-600/20 text-primary-400"
            : "text-slate-300 hover:bg-sidebar-hover hover:text-white",
          item.disabled && "opacity-50 cursor-not-allowed",
          isCollapsed && !isNested && "justify-center px-2"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {Icon && (
          <Icon
            className={cn(
              "shrink-0 transition-colors",
              isActive || hasActiveChild
                ? "text-primary-400"
                : "text-slate-400",
              isCollapsed ? "h-5 w-5" : "h-4.5 w-4.5"
            )}
          />
        )}

        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>

            {item.badge && (
              <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                {item.badge}
              </span>
            )}

            {hasChildren && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </>
        )}
      </button>

      {/* Nested Items */}
      {hasChildren && !isCollapsed && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              variants={expandVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {(item.children ?? []).map((child) => (
                  <SidebarItem
                    key={child.id}
                    item={child}
                    isActive={child.id === activeId}
                    depth={depth + 1}
                    {...(onNavigate ? { onNavigate } : {})}
                    {...(activeId ? { activeId } : {})}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      items,
      activeId,
      expandedIds = new Set(),
      onToggleExpand,
      onNavigate,
      isCollapsed = false,
      onToggleCollapse,
      header,
      footer,
      className,
    },
    ref
  ) => {
    return (
      <aside
        ref={ref}
        className={cn(
          "flex flex-col h-full bg-sidebar",
          "transition-all duration-300 ease-out",
          isCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
          className
        )}
      >
        {/* Header */}
        {header && (
          <div
            className={cn(
              "shrink-0 border-b border-slate-700/50",
              isCollapsed ? "px-2 py-4" : "px-4 py-5"
            )}
          >
            {header}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              isExpanded={expandedIds.has(item.id)}
              isCollapsed={isCollapsed}
              onToggle={() => onToggleExpand?.(item.id)}
              {...(onNavigate ? { onNavigate } : {})}
              {...(activeId ? { activeId } : {})}
            />
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "shrink-0 border-t border-slate-700/50",
              isCollapsed ? "px-2 py-3" : "px-4 py-4"
            )}
          >
            {footer}
          </div>
        )}

        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "absolute -right-3 top-20 z-10",
              "h-6 w-6 rounded-full",
              "bg-sidebar border-2 border-slate-600",
              "flex items-center justify-center",
              "text-slate-400 hover:text-white hover:border-slate-500",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";

// ============================================================================
// SIDEBAR SECTION COMPONENT
// ============================================================================

export interface SidebarSectionProps {
  /** Section title */
  title?: string;
  /** Section items */
  children: ReactNode;
  /** Collapsed state */
  isCollapsed?: boolean;
  /** Additional class name */
  className?: string;
}

export function SidebarSection({
  title,
  children,
  isCollapsed,
  className,
}: SidebarSectionProps): React.ReactNode {
  return (
    <div className={cn("mb-4", className)}>
      {title && !isCollapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ============================================================================
// SIDEBAR LOGO COMPONENT
// ============================================================================

export interface SidebarLogoProps {
  /** Logo icon or image */
  logo?: ReactNode;
  /** Application name */
  name?: string;
  /** Tagline or version */
  tagline?: string;
  /** Collapsed state */
  isCollapsed?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

export function SidebarLogo({
  logo,
  name,
  tagline,
  isCollapsed,
  onClick,
  className,
}: SidebarLogoProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full",
        "text-left transition-colors",
        "focus-visible:outline-none",
        onClick && "cursor-pointer hover:opacity-80",
        !onClick && "cursor-default",
        className
      )}
    >
      {logo && (
        <div className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-primary-600">
          {logo}
        </div>
      )}
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          {name && (
            <h1 className="text-lg font-bold text-white font-display truncate">
              {name}
            </h1>
          )}
          {tagline && (
            <p className="text-xs text-slate-400 truncate">{tagline}</p>
          )}
        </div>
      )}
    </button>
  );
}

// ============================================================================
// SIDEBAR USER COMPONENT
// ============================================================================

export interface SidebarUserProps {
  /** User name */
  name: string;
  /** User email or role */
  email?: string;
  /** Avatar image URL */
  avatarUrl?: string;
  /** Avatar fallback (initials) */
  avatarFallback?: string;
  /** Collapsed state */
  isCollapsed?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

export function SidebarUser({
  name,
  email,
  avatarUrl,
  avatarFallback,
  isCollapsed,
  onClick,
  className,
}: SidebarUserProps): ReactNode {
  const initials =
    avatarFallback ??
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-2 -m-2 rounded-lg",
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
        onClick && "cursor-pointer hover:bg-sidebar-hover",
        !onClick && "cursor-default",
        isCollapsed && "justify-center p-0 m-0",
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-primary-500 to-primary-700 text-white font-medium",
          isCollapsed ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          {email && <p className="text-xs text-slate-400 truncate">{email}</p>}
        </div>
      )}
    </button>
  );
}
