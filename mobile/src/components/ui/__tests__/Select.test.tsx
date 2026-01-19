import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Select } from '../Select';

// Mock useTheme
jest.mock('../../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            surface: '#FFFFFF',
            surfaceHover: '#F5F5F5',
            text: '#000000',
            textSecondary: '#666666',
            textMuted: '#999999',
            border: '#CCCCCC',
            primary: '#007AFF',
        },
    }),
}));

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
    ChevronDown: () => 'ChevronDown',
    X: () => 'X',
    Check: () => 'Check',
}));

describe('Select Component', () => {
    const options = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
    ];

    it('renders placeholder when no value selected', () => {
        const { getByText } = render(
            <Select options={options} onChange={jest.fn()} placeholder="Select an option" />
        );
        expect(getByText('Select an option')).toBeTruthy();
    });

    it('renders selected option label', () => {
        const { getByText } = render(
            <Select options={options} value="opt1" onChange={jest.fn()} />
        );
        expect(getByText('Option 1')).toBeTruthy();
    });

    it('opens modal on press', () => {
        const { getByText, queryByText } = render(
            <Select options={options} onChange={jest.fn()} placeholder="Select" />
        );

        // Modal content shouldn't be visible initially (or "Option 2" assuming flatlist renders only when visible/mounted)
        // However, RN Modal behavior in JSDOM/Node environment renders children in a separate root usually? 
        // Or if checking visible prop.
        // Testing Library RNT usually queries everything. 
        // Using `placeholder` text as trigger.

        const trigger = getByText('Select');
        fireEvent.press(trigger);

        // Now options should be available
        expect(getByText('Option 2')).toBeTruthy();
    });

    it('calls onChange when option is selected', () => {
        const onChange = jest.fn();
        const { getByText } = render(
            <Select options={options} onChange={onChange} placeholder="Select" />
        );

        fireEvent.press(getByText('Select')); // Open
        fireEvent.press(getByText('Option 2')); // Select

        expect(onChange).toHaveBeenCalledWith('opt2');
    });

    it('does not open when disabled', () => {
        const { getByText, queryByText } = render(
            <Select options={options} onChange={jest.fn()} placeholder="Select" disabled />
        );

        fireEvent.press(getByText('Select'));
        // If it opened, Option 2 would be found
        // If not, it shouldn't be found (assuming implementation hides list when closed)
        // Actually, Modal children might still be in tree depending on implementation?
        // Implementation: <Modal visible={modalVisible}> ... </Modal>
        // In RNT, Modal contents are usually not findable if visible=false.
        expect(queryByText('Option 2')).toBeNull();
    });
});
