'use client';

import { CloudSync, WarningCircle } from 'iconoir-react';

interface SyncStatusBadgeProps {
  status: 'synced' | 'pending' | 'failed';
  className?: string;
}

export function SyncStatusBadge({ status, className = '' }: SyncStatusBadgeProps) {
  if (status === 'synced') return null; // Don't show anything for synced items

  const config = {
    pending: {
      icon: CloudSync,
      text: 'Synchronisation...',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    failed: {
      icon: WarningCircle,
      text: 'Échec de synchro',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  };

  const { icon: Icon, text, color, bg } = config[status];

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${bg} ${className}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>{text}</span>
    </div>
  );
}
