// Zustand Global State Management
// Zero-Cost Architecture - Client-side state only
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // User preferences
      darkMode: true,
      sidebarCollapsed: false,

      // Data state
      hasData: false,
      lastUploadDate: null,
      totalCampaigns: 0,

      // Warnings and notifications
      showDataLossWarning: true,
      showBackupReminder: false,
      showStorageWarning: false,

      // AI quota tracking
      aiQuotaStatus: null,

      // Actions
      setHasData: (hasData) => set({ hasData }),

      setLastUploadDate: (date) => set({ lastUploadDate: date }),

      setTotalCampaigns: (count) => set({ totalCampaigns: count }),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      dismissDataLossWarning: () => set({ showDataLossWarning: false }),

      setShowBackupReminder: (show) => set({ showBackupReminder: show }),

      setShowStorageWarning: (show) => set({ showStorageWarning: show }),

      setAIQuotaStatus: (status) => set({ aiQuotaStatus: status }),

      // Reset all data (for testing)
      reset: () => set({
        hasData: false,
        lastUploadDate: null,
        totalCampaigns: 0,
        showDataLossWarning: true,
        showBackupReminder: false,
        showStorageWarning: false,
        aiQuotaStatus: null
      })
    }),
    {
      name: 'vibeppc-storage', // localStorage key
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        showDataLossWarning: state.showDataLossWarning
      })
    }
  )
);
