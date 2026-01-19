import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { Alert } from 'react-native';

// Mocks
jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            background: '#FFFFFF',
            text: '#000000',
            textMuted: '#999999',
            primary: 'blue',
            secondary: 'purple',
            border: '#CCCCCC',
            backgroundCard: '#F5F5F5',
        },
    }),
}));

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signUp: mockSignUp,
        user: null,
    }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form by default', () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        expect(getByText('Sign in to continue')).toBeTruthy();
        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
        expect(getByText('Sign In')).toBeTruthy();
    });

    it('toggles to sign up mode', () => {
        const { getByText } = render(<LoginScreen />);

        fireEvent.press(getByText("Don't have an account? Sign Up"));

        expect(getByText('Create your account')).toBeTruthy();
        expect(getByText('Sign Up')).toBeTruthy();
    });

    it('shows error alert if fields are empty', () => {
        const { getByText } = render(<LoginScreen />);

        fireEvent.press(getByText('Sign In'));

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter email and password');
        expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('calls signIn with correct credentials', async () => {
        mockSignIn.mockResolvedValue({ error: null });
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('calls signUp with correct credentials in signup mode', async () => {
        mockSignUp.mockResolvedValue({ error: null });
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        // Switch to Sign Up
        fireEvent.press(getByText("Don't have an account? Sign Up"));

        fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'pass123');
        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'pass123');
        });
    });

    it('shows alert on auth error', async () => {
        mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid credentials');
        });
    });
});
