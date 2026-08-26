import Chip from '@/components/ui/Chip';
import { Colors } from '@/constants/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import React from 'react';

export default function SyncStatusBadge() {
  const online = useNetworkStatus();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  if (!online) {
    return <Chip label="OFFLINE" color={Colors.accentHot} size="sm" />;
  }

  if (isFetching > 0 || isMutating > 0) {
    return <Chip label="SYNCING" color={Colors.accentSecondary} size="sm" />;
  }

  return <Chip label="SYNCED" color={Colors.accentLime} size="sm" />;
}
