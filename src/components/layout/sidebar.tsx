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
    <div className="px-3">
      <button
        type="button"
        disabled={item.disabled}
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3.5 px-3 py-3 rounded-xl",
          "text-[0.9375rem] font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
          isNested && "ml-4 w-[calc(100%-1rem)] px-2.5 py-2 text-sm",
          isActive || hasActiveChild
            ? "bg-primary-600/15 text-primary-400 shadow-sm shadow-primary-900/10"
            : "text-slate-400 hover:bg-white/5 hover:text-white",
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
                : "text-slate-500",
              isCollapsed ? "h-6 w-6" : "h-5 w-5"
            )}
            strokeWidth={isActive || hasActiveChild ? 2.25 : 2}
          />
        )}

        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>

            {item.badge && (
              <span className="shrink-0 px-2.5 py-0.5 text-[0.6875rem] font-bold bg-primary-600 text-white rounded-full uppercase tracking-wider">
                {item.badge}
              </span>
            )}

            {hasChildren && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300",
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
              <div className="mt-1.5 space-y-1">
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
          "flex flex-col h-full bg-sidebar relative border-r border-slate-700/30",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
          className
        )}
      >
        {/* Curved Header Background Container */}
        {!isCollapsed && (
          <div
            className="absolute top-0 left-0 right-0 bg-primary-600"
            style={{ height: "var(--sidebar-logo-height)" }}
          />
        )}

        {/* Logo Section */}
        {header && (
          <div
            className={cn(
              "relative shrink-0 z-10",
              isCollapsed
                ? "h-16 flex items-center justify-center border-b border-sidebar-hover shadow-sm"
                : "h-[var(--sidebar-logo-height)] flex items-center px-6 bg-primary-600 rounded-br-[var(--radius-curved)]"
            )}
          >
            {header}

            {/* The Curve Element (bottom-right of branded header) */}
            {!isCollapsed && (
              <div className="absolute -bottom-10 right-0 h-10 w-10 overflow-hidden pointer-events-none">
                <div className="h-20 w-20 rounded-full bg-primary-600 absolute -top-10 -right-10" />
                <div className="h-full w-full bg-sidebar rounded-tr-[var(--radius-curved)] absolute top-0 right-0" />
              </div>
            )}
          </div>
        )}

        {/* Navigation Content Area */}
        <div
          className={cn(
            "flex-1 flex flex-col overflow-hidden min-h-0",
            !isCollapsed
              ? "rounded-tl-[var(--radius-curved)] bg-sidebar relative z-10"
              : "bg-sidebar"
          )}
        >
          {/* Scrollable Nav */}
          <nav className="flex-1 overflow-y-auto pt-6 pb-4 space-y-2">
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
                "shrink-0 border-t border-slate-700/30",
                isCollapsed ? "px-2 py-4" : "px-5 py-5"
              )}
            >
              {footer}
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "absolute -right-3.5 top-24 z-20",
              "h-7 w-7 rounded-lg",
              "bg-sidebar border-2 border-slate-700",
              "flex items-center justify-center shadow-lg",
              "text-slate-400 hover:text-primary-400 hover:border-primary-500/50",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        )}
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";

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
        "flex items-center gap-4 w-full",
        "text-left transition-opacity duration-200",
        "focus-visible:outline-none",
        onClick && "cursor-pointer hover:opacity-90",
        !onClick && "cursor-default",
        className
      )}
    >
      {logo && (
        <div
          className={cn(
            "shrink-0 flex items-center justify-center rounded-xl",
            isCollapsed
              ? "h-10 w-10 bg-primary-600 text-white"
              : "h-11 w-11 bg-white/10 text-white backdrop-blur-sm"
          )}
        >
          {logo}
        </div>
      )}
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          {name && (
            <h1 className="text-xl font-black text-white font-display tracking-tight leading-none mb-0.5">
              {name}
            </h1>
          )}
          {tagline && (
            <p className="text-[0.6875rem] font-bold text-white/50 truncate uppercase tracking-widest">
              {tagline}
            </p>
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
        "flex items-center gap-3.5 w-full p-2.5 rounded-xl",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50",
        onClick && "cursor-pointer hover:bg-white/5",
        !onClick && "cursor-default",
        isCollapsed && "justify-center p-0 m-0",
        className
      )}
    >
      {/* Avatar Container with Glow */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "rounded-xl flex items-center justify-center relative z-10",
            "bg-gradient-to-br from-primary-400 to-primary-700 text-white font-bold",
            isCollapsed
              ? "h-9 w-9 text-xs"
              : "h-11 w-11 text-sm shadow-md shadow-primary-950/20"
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            initials
          )}
        </div>
        {!isCollapsed && (
          <div className="absolute inset-0 bg-primary-500/20 blur-md rounded-xl -z-0" />
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[0.9375rem] font-bold text-white truncate leading-tight mb-0.5">
            {name}
          </p>
          {email && (
            <p className="text-[0.6875rem] font-medium text-slate-500 truncate">
              {email}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
