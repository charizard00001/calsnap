import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { reportError } from '@/lib/errorReporter';

// Replaces expo-router's default red-screen. Catches render/runtime errors
// anywhere in the tree, reports them, and gives the user a way out instead
// of a dead screen.
export function RootErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error, { boundary: 'root' });
  }, [error]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🌀</Text>
        <Text style={styles.title}>Something broke</Text>
        <Text style={styles.body}>
          CalSnap hit an unexpected error. Your logged meals are safe on your
          account — reloading usually clears it.
        </Text>

        <Pressable style={styles.button} onPress={() => retry()}>
          <Text style={styles.buttonText}>Reload</Text>
        </Pressable>

        {__DEV__ && (
          <Text style={styles.debug}>
            {error.name}: {error.message}
            {'\n'}
            {error.stack}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    maxWidth: 340,
  },
  button: {
    backgroundColor: Colors.accentPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  debug: {
    marginTop: Spacing.xl,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontFamily: 'SpaceMono',
  },
});
