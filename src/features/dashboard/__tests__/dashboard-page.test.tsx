import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardPage } from "../dashboard-page";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useDashboard", () => ({
  useDashboardMetrics: () => ({ metrics: {}, isLoading: false }),
  useRecentTransactions: () => ({ transactions: [], isLoading: false }),
  useSalesChartData: () => ({ chartData: [], isLoading: false }),
}));

// Mock child components to verify props and events if needed
vi.mock("../components", () => ({
  MetricCards: () => <div data-testid="metric-cards">MetricCards</div>,
  SalesChart: () => <div data-testid="sales-chart">SalesChart</div>,
  QuickActions: ({ onAction }: any) => (
    <div data-testid="quick-actions">
      <button onClick={() => onAction("add-sale")}>Add Sale</button>
    </div>
  ),
  RecentTransactions: () => (
    <div data-testid="recent-transactions">RecentTransactions</div>
  ),
  FloatingActionButton: () => <div data-testid="fab">FAB</div>,
}));

vi.mock("@/components/layout", () => ({
  PageContainer: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard components", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("metric-cards")).toBeInTheDocument();
    expect(screen.getByTestId("sales-chart")).toBeInTheDocument();
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    expect(screen.getByTestId("recent-transactions")).toBeInTheDocument();
  });

  it("navigates when quick action is triggered", () => {
    render(<DashboardPage />);

    // QuickActions mock has a button that calls onAction('add-sale')
    fireEvent.click(screen.getByText("Add Sale"));

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/sale/invoices" });
  });
});
