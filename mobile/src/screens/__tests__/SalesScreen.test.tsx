import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SalesScreen } from '../SalesScreen';
import { useQuery } from '@powersync/react-native';
import { useNavigation } from '@react-navigation/native';

// Mocks
jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            background: '#fff',
            surface: '#fff',
            accent: 'purple',
            text: 'black',
            textMuted: 'grey',
            surfaceHover: '#eee',
            info: 'blue',
            success: 'green',
            warning: 'orange',
            danger: 'red',
        },
    }),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 20 }),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: jest.fn(),
}));

jest.mock('@powersync/react-native', () => ({
    useQuery: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
    Search: () => 'Search',
    FileText: () => 'FileText',
    ChevronRight: () => 'ChevronRight',
}));

describe('SalesScreen', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
    });

    it('renders loading state or empty state initially', () => {
        (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
        const { getByText } = render(<SalesScreen />);

        expect(getByText('No invoices yet')).toBeTruthy();
        expect(getByText('Create your first sale')).toBeTruthy();
    });

    it('renders list of invoices', () => {
        const mockInvoices = [
            { id: '1', invoice_number: 'INV-001', customer_name: 'John Doe', total: 100, status: 'paid', date: '2023-01-01' },
            { id: '2', invoice_number: 'INV-002', customer_name: 'Jane Smith', total: 250, status: 'draft', date: '2023-01-05' },
        ];
        (useQuery as jest.Mock).mockReturnValue({ data: mockInvoices, isLoading: false });

        const { getByText, getAllByText } = render(<SalesScreen />);

        expect(getByText('INV-001')).toBeTruthy();
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('$100.00')).toBeTruthy();
        expect(getByText('paid')).toBeTruthy();

        expect(getByText('INV-002')).toBeTruthy();
    });

    it('navigates to new invoice form on FAB press', () => {
        (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
        const { getByText } = render(<SalesScreen />);

        fireEvent.press(getByText('+ New'));
        expect(mockNavigate).toHaveBeenCalledWith('SaleInvoiceForm');
    });

    it('navigates to invoice details on item press', () => {
        const mockInvoices = [
            { id: '1', invoice_number: 'INV-001', customer_name: 'John', total: 100, status: 'paid', date: '2023-01-01' },
        ];
        (useQuery as jest.Mock).mockReturnValue({ data: mockInvoices, isLoading: false });

        const { getByText } = render(<SalesScreen />);

        fireEvent.press(getByText('INV-001'));
        // Navigation payload: { id: '1' }
        expect(mockNavigate).toHaveBeenCalledWith('SaleInvoiceForm', { id: '1' });
    });

    it('updates search query', () => {
        (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
        const { getByPlaceholderText } = render(<SalesScreen />);

        fireEvent.changeText(getByPlaceholderText('Search invoices...'), 'INV-005');

        // Verification of useQuery call with new param would require re-render or effect check.
        // useQuery is a hook called in render body.
        // Jest mock stores calls.
        // The component re-renders on state change.
        expect(useQuery).toHaveBeenCalledWith(
            expect.stringContaining('WHERE ($1 IS NULL OR si.invoice_number LIKE $1'),
            expect.arrayContaining(['%INV-005%'])
        );
    });
});
