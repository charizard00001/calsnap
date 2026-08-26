import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SyncStatusBadge() {
  const online = useNetworkStatus();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  if (!online) {
    return (
      <View style={[styles.badge, styles.offline]}>
        <View style={[styles.dot, { backgroundColor: Colors.accentHot }]} />
        <Text style={[styles.text, { color: Colors.accentHot }]}>Offline</Text>
      </View>
    );
  }

  if (isFetching > 0 || isMutating > 0) {
    return (
      <View style={[styles.badge, styles.syncing]}>
        <View style={[styles.dot, { backgroundColor: Colors.accentSecondary }]} />
        <Text style={[styles.text, { color: Colors.accentSecondary }]}>Syncing</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  offline: {
    backgroundColor: Colors.accentHot + '15',
  },
  syncing: {
    backgroundColor: Colors.accentSecondary + '15',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
});
