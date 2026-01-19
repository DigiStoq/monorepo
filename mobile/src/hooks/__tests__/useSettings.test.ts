import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCompanySettings, useInvoiceSettings, useTaxRates } from '../useSettings';
import { useQuery, usePowerSync } from '@powersync/react-native';

// Mock dependencies
jest.mock('@powersync/react-native', () => ({
  usePowerSync: jest.fn(),
  useQuery: jest.fn(),
}));

describe('useSettings Hooks', () => {
  const mockExecute = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (usePowerSync as jest.Mock).mockReturnValue({
      execute: mockExecute,
    });
  });

  describe('useCompanySettings', () => {
    it('should return null when no data exists', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useCompanySettings());
      expect(result.current.settings).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should parse company settings correctly', () => {
      const mockData = [{
        id: '1',
        name: 'Test Company',
        legal_name: 'Test Legal',
        address_street: '123 St',
        address_city: 'City',
        financial_year_start_month: 4,
        currency: 'USD',
      }];

      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useCompanySettings());
      expect(result.current.settings).toEqual({
        id: '1',
        name: 'Test Company',
        legalName: 'Test Legal',
        logoUrl: undefined,
        address: {
          street: '123 St',
          city: 'City',
          state: '',
          postalCode: '',
          country: '',
        },
        contact: {
          phone: '',
          email: '',
          website: '',
        },
        registration: {
          taxId: undefined,
          ein: undefined,
        },
        financialYear: {
          startMonth: 4,
          startDay: 1,
        },
        currency: 'USD',
        locale: 'en-US',
        timezone: 'America/New_York',
      });
    });

    it('should update company settings', async () => {
      const mockData = [{ id: '1', name: 'Old Name' }];
      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
      });

      const { result } = renderHook(() => useCompanySettings());

      await act(async () => {
        await result.current.updateCompanySettings({ name: 'New Name' });
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE company_settings SET name = ?, updated_at = ? WHERE id = ?'),
        expect.arrayContaining(['New Name', '1'])
      );
    });
  });

  describe('useInvoiceSettings', () => {
    it('should return default settings when no data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
      });

      const { result } = renderHook(() => useInvoiceSettings());
      expect(result.current.settings).toBeNull();
    });

    it('should parse invoice settings', () => {
      const mockData = [{
        id: '1',
        prefix: 'INV-',
        next_number: 100,
        padding: 4,
        show_payment_qr: 1,
        due_date_days: 14,
      }];

      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
      });

      const { result } = renderHook(() => useInvoiceSettings());
      expect(result.current.settings).toMatchObject({
        prefix: 'INV-',
        nextNumber: 100,
        padding: 4,
        showPaymentQR: true,
        dueDateDays: 14,
        // Check defaulted values
        taxEnabled: true,
        lateFeesEnabled: false,
      });
    });

    it('should update invoice settings', async () => {
      const mockData = [{ id: '1', user_id: 'user1', prefix: 'INV-' }];
      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
      });

      const { result } = renderHook(() => useInvoiceSettings());

      await act(async () => {
        await result.current.updateInvoiceSettings({ nextNumber: 101 });
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE invoice_settings SET next_number = ?, updated_at = ? WHERE user_id = ?'),
        expect.arrayContaining([101, 'user1'])
      );
    });
  });

  describe('useTaxRates', () => {
    it('should list tax rates', () => {
      const mockData = [
        { id: 't1', name: 'VAT', rate: 20, type: 'percentage', is_default: 1, is_active: 1 },
        { id: 't2', name: 'Zero', rate: 0, type: 'percentage', is_default: 0, is_active: 1 },
      ];

      (useQuery as jest.Mock).mockReturnValue({
        data: mockData,
        loading: false,
      });

      const { result } = renderHook(() => useTaxRates());
      expect(result.current.taxRates).toHaveLength(2);
      expect(result.current.taxRates[0].name).toBe('VAT');
      expect(result.current.taxRates[0].rate).toBe(20);
      expect(result.current.taxRates[0].isDefault).toBe(true);
    });

    it('should create tax rate', async () => {
      const { result } = renderHook(() => useTaxRates());

      await act(async () => {
        await result.current.createTaxRate({
          name: 'New Tax',
          rate: 10,
          type: 'percentage',
          description: '',
          isDefault: false
        });
      });

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tax_rates'),
        expect.arrayContaining(['New Tax', 10, 'percentage'])
      );
    });

    it('should delete (soft delete) tax rate', async () => {
      const { result } = renderHook(() => useTaxRates());

      await act(async () => {
        await result.current.deleteTaxRate('t1');
      });

      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE tax_rates SET is_active = 0 WHERE id = ?',
        ['t1']
      );
    });
  });
});
