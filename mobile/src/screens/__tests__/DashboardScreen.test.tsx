import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { useQuery } from '@powersync/react-native';

// Mocks
jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            background: '#fff',
            surface: '#fff',
            primary: 'blue',
            text: 'black',
            success: 'green',
            danger: 'red',
            warning: 'orange',
            textMuted: 'grey',
            textOnPrimary: 'white',
        },
    }),
}));

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { email: 'testuser@example.com' },
    }),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@powersync/react-native', () => ({
    useQuery: jest.fn(),
}));

jest.mock('../../components/SyncStatus', () => ({
    SyncStatus: () => 'SyncStatusMock',
}));

jest.mock('lucide-react-native', () => ({
    Package: () => 'Icon',
    Bell: () => 'Icon',
    MessageCircle: () => 'Icon',
    TrendingUp: () => 'Icon',
    Box: () => 'Icon',
    AlertTriangle: () => 'Icon',
    XCircle: () => 'Icon',
    ArrowUpRight: () => 'Icon',
}));

describe('DashboardScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default useQuery mock implementation
        (useQuery as jest.Mock).mockImplementation((sql: string) => {
            if (sql.includes('FROM customers')) return { data: [{ count: 120 }] };
            if (sql.includes('quantity <= 0')) return { data: [{ count: 5 }] }; // Out of stock
            if (sql.includes('quantity > 0 AND quantity < 10')) return { data: [{ count: 12 }] }; // Low stock
            if (sql.includes('FROM items')) return { data: [{ count: 500 }] }; // Total items (checked after out/low)
            if (sql.includes('FROM sale_invoices') && sql.includes('SUM(total)')) return { data: [{ sum: 25000 }] };
            if (sql.includes('GROUP BY date(created_at)')) return {
                data: [
                    { date: '2023-01-01', total: 1000 },
                    { date: '2023-01-02', total: 2000 },
                ]
            }; // Chart data

            return { data: [] };
        });
    });

    it('renders user greeting and email', () => {
        const { getByText } = render(<DashboardScreen />);
        expect(getByText('GOOD MORNING! ^-^')).toBeTruthy();
        expect(getByText('testuser')).toBeTruthy();
    });

    it('renders stats correctly', () => {
        const { getByText } = render(<DashboardScreen />);

        // Total Sales: $25,000.00
        // Logic: formatCurrency(25000) -> $25,000
        expect(getByText('$25,000')).toBeTruthy();
        expect(getByText('Total Sales Value')).toBeTruthy();

        // Total Stock: 500
        expect(getByText('500')).toBeTruthy();
        expect(getByText('Total Stock')).toBeTruthy();

        // Out of Stock: 5
        expect(getByText('5')).toBeTruthy();

        // Low Stock: 12
        expect(getByText('12')).toBeTruthy();
    });

    it('renders chart title', () => {
        const { getByText } = render(<DashboardScreen />);
        expect(getByText('Sales Trend')).toBeTruthy();
    });
});
