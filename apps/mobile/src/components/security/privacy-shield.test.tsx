import React from 'react';
import { AppState, Text, View } from 'react-native';
import { act } from '@testing-library/react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { PrivacyShield } from './privacy-shield';

describe('PrivacyShield', () => {
  afterEach(cleanup);

  it('renders children normally when app is active', () => {
    render(
      <PrivacyShield>
        <View testID="child-content">
          <Text>Sensitive Health Data</Text>
        </View>
      </PrivacyShield>
    );

    expect(screen.getByTestId('child-content')).toBeOnTheScreen();
    expect(screen.queryByTestId('privacy-shield-overlay')).toBeNull();
  });

  it('renders privacy overlay when AppState transitions to background or inactive', () => {
    let listener: (state: string) => void = () => {};
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, cb) => {
      listener = cb as any;
      return { remove: jest.fn() } as any;
    });

    render(
      <PrivacyShield>
        <View testID="child-content">
          <Text>Sensitive Health Data</Text>
        </View>
      </PrivacyShield>
    );

    // Simulate transition to background wrapped in act
    act(() => {
      listener('background');
    });

    expect(screen.getByTestId('privacy-shield-overlay')).toBeOnTheScreen();
    expect(screen.getByText('Happy Women')).toBeOnTheScreen();
    expect(screen.getByText('Protected for your privacy')).toBeOnTheScreen();
  });
});
