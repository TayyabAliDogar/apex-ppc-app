// Storage Quota Monitoring
// Mandatory Mitigation: Monitor browser storage and warn users

export async function getStorageInfo() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return {
      supported: false,
      used: 0,
      quota: 0,
      usedMB: 0,
      quotaMB: 0,
      percentUsed: 0
    };
  }

  const estimate = await navigator.storage.estimate();

  return {
    supported: true,
    used: estimate.usage || 0,
    quota: estimate.quota || 0,
    usedMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
    quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
    percentUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(1) : 0
  };
}

export async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }

  const isPersisted = await navigator.storage.persist();
  return isPersisted;
}

export async function checkStorageQuota() {
  const info = await getStorageInfo();

  if (!info.supported) {
    return { status: 'unknown', message: 'Storage API not supported' };
  }

  const percentUsed = parseFloat(info.percentUsed);

  if (percentUsed > 90) {
    return {
      status: 'critical',
      message: `Storage almost full (${info.percentUsed}%). Export your data and clear old campaigns.`,
      info
    };
  }

  if (percentUsed > 75) {
    return {
      status: 'warning',
      message: `Storage ${info.percentUsed}% full. Consider exporting data soon.`,
      info
    };
  }

  return {
    status: 'ok',
    message: `Storage ${info.percentUsed}% used (${info.usedMB}MB / ${info.quotaMB}MB)`,
    info
  };
}

// Check if user has backed up recently (Mandatory Mitigation)
export function checkLastBackup() {
  const lastBackup = localStorage.getItem('last_backup');

  if (!lastBackup) {
    return {
      needsBackup: true,
      message: 'You haven\'t backed up your data yet. Export now to prevent loss.',
      daysSinceBackup: null
    };
  }

  const lastBackupTime = parseInt(lastBackup);
  const daysSinceBackup = Math.floor((Date.now() - lastBackupTime) / (24 * 60 * 60 * 1000));

  if (daysSinceBackup >= 7) {
    return {
      needsBackup: true,
      message: `Last backup was ${daysSinceBackup} days ago. Export your data now.`,
      daysSinceBackup
    };
  }

  return {
    needsBackup: false,
    message: `Last backup: ${daysSinceBackup} days ago`,
    daysSinceBackup
  };
}

export function markBackupComplete() {
  localStorage.setItem('last_backup', Date.now().toString());
}
