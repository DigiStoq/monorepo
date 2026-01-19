import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUserPreferences } from '../useUserPreferences';
import { useQuery } from '@powersync/react-native';
import { db } from '../../lib/powersync';

// Mock dependencies
jest.mock('@powersync/react-native', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../lib/powersync', () => ({
  db: {
    execute: jest.fn(),
    getAll: jest.fn(),
  },
}));

describe('useUserPreferences Hook', () => {
  const mockExecute = db.execute as jest.Mock;
  const mockGetAll = db.getAll as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Reading Preferences', () => {
    it('should return default preferences when no data exists', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { result } = renderHook(() => useUserPreferences());
      expect(result.current.preferences).toEqual({
        theme: 'system',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: {
          decimalSeparator: '.',
          thousandsSeparator: ',',
          decimalPlaces: 2,
        },
        defaultInvoiceTerms: 30,
        defaultPaymentTerms: 'Net 30',
        autoSave: true,
        compactMode: false,
        showDashboardWidgets: [],
      });
    });

    it('should parse preference row from DB', () => {
      const mockRow = {
        theme: 'dark',
        date_format: 'YYYY-MM-DD',
        decimal_separator: ',',
        thousands_separator: '.',
        decimal_places: 3,
        compact_mode: 1,
        auto_save: 0,
        default_invoice_terms: 14,
        dashboard_widgets: '["sales-chart"]',
      };

      (useQuery as jest.Mock).mockReturnValue({
        data: [mockRow],
        isLoading: false,
      });

      const { result } = renderHook(() => useUserPreferences());

      expect(result.current.preferences).toMatchObject({
        theme: 'dark',
        dateFormat: 'YYYY-MM-DD',
        numberFormat: {
          decimalSeparator: ',',
          thousandsSeparator: '.',
          decimalPlaces: 3,
        },
        compactMode: true,
        autoSave: false,
        defaultInvoiceTerms: 14,
        showDashboardWidgets: ['sales-chart'],
      });
    });
  });

  describe('Updating Preferences', () => {
    it('should insert new preferences if none exist', async () => {
      // simulate no data from useQuery for initial state
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      // simulate no existing record in DB check
      mockGetAll.mockResolvedValue([]); 

      const { result } = renderHook(() => useUserPreferences());

      await act(async () => {
        await result.current.updatePreferences({
            theme: 'light',
            autoSave: true
        });
      });

      // Verification of INSERT
      expect(mockGetAll).toHaveBeenCalledWith(expect.stringContaining('SELECT id, user_id FROM user_preferences'));
      
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_preferences'),
        expect.arrayContaining(['light', 1]) // theme, autoSafe
      );
    });

    it('should update existing preferences', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [{ id: 'pref-123', user_id: 'u1' }],
        isLoading: false,
      });

      // simulate existing record in DB check
      mockGetAll.mockResolvedValue([{ id: 'pref-123', user_id: 'u1' }]);

      const { result } = renderHook(() => useUserPreferences());

      await act(async () => {
        await result.current.updatePreferences({
            dateFormat: 'MM/DD/YYYY'
        });
      });

      // Verification of UPDATE
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_preferences SET date_format = ?, updated_at = ? WHERE id = ?'),
        expect.arrayContaining(['MM/DD/YYYY', 'pref-123'])
      );
    });
    
    it('should handle nested numberFormat updates', async () => {
        mockGetAll.mockResolvedValue([{ id: 'pref-123' }]);
        (useQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });

        const { result } = renderHook(() => useUserPreferences());

        await act(async () => {
            await result.current.updatePreferences({
                numberFormat: { decimalPlaces: 4, decimalSeparator: '.', thousandsSeparator: ',' } // Need full object? Types say Partial<AppPreferences> but nested? 
                // The hook implementation checks sub-properties of numberFormat if provided.
                // But the type in hook is `newPrefs: Partial<AppPreferences>`. 
                // AppPreferences has numberFormat: NumberFormat (not partial in interface).
                // So I must provide full NumberFormat object in update?
                // Looking at implementation: 
                // if (newPrefs.numberFormat !== undefined) { if (newPrefs.numberFormat.decimalSeparator !== undefined) ... }
                // Use cast or just provide full object for test simplicity.
            } as any); 
        });

        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining('decimal_places = ?'),
            expect.arrayContaining([4])
        );
    });
  });
});
