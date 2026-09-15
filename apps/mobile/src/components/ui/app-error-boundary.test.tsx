import React from 'react';
import { Text, View } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { AppErrorBoundary } from './app-error-boundary';

const ProblemChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test crash');
  }
  return (
    <View testID="safe-content">
      <Text>All systems nominal</Text>
    </View>
  );
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <AppErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </AppErrorBoundary>
    );

    expect(screen.getByTestId('safe-content')).toBeOnTheScreen();
    expect(screen.queryByTestId('error-boundary-fallback')).toBeNull();
  });

  it('catches render errors and displays resilient pastel fallback UI', () => {
    render(
      <AppErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </AppErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeOnTheScreen();
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByTestId('reload-app-button')).toBeOnTheScreen();
    expect(screen.queryByTestId('safe-content')).toBeNull();
  });
});
