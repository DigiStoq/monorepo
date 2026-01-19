import React from 'react';
import { render } from '@testing-library/react-native';
import { Card, CardHeader, CardBody } from '../Card';
import { Text } from 'react-native';

// Mock useTheme
jest.mock('../../../contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            surface: '#FFFFFF',
            border: '#CCCCCC',
            borderLight: '#EEEEEE',
            textSecondary: '#666666',
        },
    }),
}));

describe('Card Component', () => {
    it('renders children correctly', () => {
        const { getByText } = render(
            <Card>
                <Text>Card Content</Text>
            </Card>
        );
        expect(getByText('Card Content')).toBeTruthy();
    });

    it('renders CardHeader with title', () => {
        const { getByText } = render(
            <Card>
                <CardHeader title="My Title" />
            </Card>
        );
        expect(getByText('My Title')).toBeTruthy();
    });

    it('renders CardHeader with action', () => {
        const { getByText } = render(
            <Card>
                <CardHeader title="Title" action={<Text>Action</Text>} />
            </Card>
        );
        expect(getByText('Action')).toBeTruthy();
    });

    it('renders CardBody with children', () => {
        const { getByText } = render(
            <Card>
                <CardBody>
                    <Text>Body Content</Text>
                </CardBody>
            </Card>
        );
        expect(getByText('Body Content')).toBeTruthy();
    });
});
