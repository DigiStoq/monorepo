import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import { Alert } from 'react-native';

// Mocks
jest.mock('react-native', () => {
    const rn = jest.requireActual('react-native');
    rn.Alert.alert = jest.fn();
    return rn;
});

const mockSignOut = jest.fn();
const mockSetMode = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { email: 'user@example.com' },
        signOut: mockSignOut,
    }),
}));

jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            background: 'white',
            text: 'black',
            textMuted: 'grey',
            primary: 'blue',
            surface: 'white',
            danger: 'red',
        },
        isDark: false,
        setMode: mockSetMode,
    }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../hooks/useSettings', () => ({
    useCompanySettings: () => ({ settings: { name: 'Test Corp' } }),
}));

jest.mock('lucide-react-native', () => ({
    ChevronRight: () => 'ChevronRight',
    ShoppingCart: () => 'Icon',
    Receipt: () => 'Icon',
    Box: () => 'Icon',
    Users: () => 'Icon',
    Wallet: () => 'Icon',
    Wrench: () => 'Icon',
    Settings: () => 'Icon',
    LogOut: () => 'Icon',
    Menu: () => 'Icon',
}));

describe('SettingsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders menu items', () => {
        const { getByText } = render(<SettingsScreen />);

        expect(getByText('Sales')).toBeTruthy();
        expect(getByText('Purchases')).toBeTruthy();
        expect(getByText('Company Settings')).toBeTruthy();
        expect(getByText('Sign Out')).toBeTruthy();
    });

    it('navigates when menu item is pressed', () => {
        const { getByText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Sales'));
        expect(mockNavigate).toHaveBeenCalledWith('SalesSummary');

        fireEvent.press(getByText('Company Settings'));
        expect(mockNavigate).toHaveBeenCalledWith('CompanySettings');
    });

    it('toggles dark mode', () => {
        const { getByRole, getAllByRole, getByText, UNSAFE_getByType } = render(<SettingsScreen />);

        // Finding the switch. React Native Switch.
        // Testing Library has getByRole('switch')? Not effectively for RN sometimes.
        // We can look for the "Dark Mode" text and find sibling switch or parent.
        // But looking at implementation: TouchableOpacity wraps the Switch?
        // Switch has `value` and `onValueChange`.
        // Let's fire switch value change directly if we can find it.

        const { Switch } = require('react-native');
        const switchComp = UNSAFE_getByType(Switch);
        fireEvent(switchComp, 'onValueChange', true);

        expect(mockSetMode).toHaveBeenCalledWith('dark');
    });

    it('confirms sign out', () => {
        const { getByText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Sign Out'));

        expect(Alert.alert).toHaveBeenCalledWith(
            'Sign Out',
            'Are you sure you want to sign out?',
            expect.any(Array)
        );

        // Simulate confirmation logic? 
        // The Alert mock is just a function. We can't trigger the callback unless we mock implementation to call it.
        // We can verify buttons structure.
        const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
        const signOutBtn = buttons.find((b: any) => b.text === 'Sign Out');

        signOutBtn.onPress();
        expect(mockSignOut).toHaveBeenCalled();
    });
});
