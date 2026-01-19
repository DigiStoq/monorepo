import React from 'react';
import { render, act } from '@testing-library/react-native';
import { SyncStatus } from '../SyncStatus';
import { usePowerSync } from '@powersync/react-native';

jest.mock('@powersync/react-native', () => ({
    usePowerSync: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
    RefreshCw: () => 'RefreshCw',
}));

describe('SyncStatus Component', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.useFakeTimers();
        mockDb = {
            currentStatus: {
                connected: false,
                downloading: false,
                uploading: false,
            },
        };
        (usePowerSync as jest.Mock).mockReturnValue(mockDb);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('renders offline status by default', () => {
        const { getByText } = render(<SyncStatus />);
        expect(getByText('Offline')).toBeTruthy();
    });

    it('renders online status when connected', () => {
        mockDb.currentStatus.connected = true;
        const { getByText, rerender } = render(<SyncStatus />);

        // Advance timers because of polling interval in useEffect
        act(() => {
            jest.advanceTimersByTime(2500);
        });

        expect(getByText('Cloud')).toBeTruthy();
    });

    it('renders syncing status when downloading', () => {
        mockDb.currentStatus = {
            connected: true,
            downloading: true,
            uploading: false,
        };
        const { getByText } = render(<SyncStatus />);

        act(() => {
            jest.advanceTimersByTime(2500);
        });

        expect(getByText('Syncing')).toBeTruthy();
    });

    it('renders syncing status when uploading', () => {
        mockDb.currentStatus = {
            connected: true,
            downloading: false,
            uploading: true,
        };

        const { getByText } = render(<SyncStatus />);

        act(() => {
            jest.advanceTimersByTime(2500);
        });

        expect(getByText('Syncing')).toBeTruthy();
    });
});
