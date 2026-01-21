import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

// Mock useTheme
jest.mock('../../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            surface: '#FFFFFF',
            text: '#000000',
            textSecondary: '#666666',
            textMuted: '#999999',
            border: '#CCCCCC',
            danger: '#FF0000',
        },
    }),
}));

describe('Input Component', () => {
    it('renders label correctly', () => {
        const { getByText } = render(<Input label="Email Address" />);
        expect(getByText('Email Address')).toBeTruthy();
    });

    it('handles text input changes', () => {
        const onChangeText = jest.fn();
        const { getByPlaceholderText } = render(
            <Input placeholder="Enter text" onChangeText={onChangeText} />
        );

        fireEvent.changeText(getByPlaceholderText('Enter text'), 'Hello World');
        expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('displays error message', () => {
        const { getByText } = render(<Input error="Invalid email" />);
        expect(getByText('Invalid email')).toBeTruthy();
    });

    it('displays helper text when no error is present', () => {
        const { getByText } = render(<Input helperText="We will never share your email." />);
        expect(getByText('We will never share your email.')).toBeTruthy();
    });

    it('hides helper text when error is present', () => {
        const { queryByText, getByText } = render(
            <Input helperText="Helper" error="Error message" />
        );
        expect(getByText('Error message')).toBeTruthy();
        expect(queryByText('Helper')).toBeNull();
    });

    it('renders with full width style when fullWidth is true', () => {
        // Hard to test styles functionally, checking snapshot or style prop
        const { toJSON } = render(<Input fullWidth />);
        expect(toJSON()).toMatchSnapshot();
    });
});
