import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const usePrivacyStore = create(
  persist(
    (set) => ({
      hiddenPages: {},
      toggle: (pageKey) =>
        set((state) => ({
          hiddenPages: {
            ...state.hiddenPages,
            [pageKey]: !state.hiddenPages[pageKey],
          },
        })),
      isHidden: (pageKey) => !!usePrivacyStore.getState().hiddenPages[pageKey],
    }),
    { name: 'privacy-store' }
  )
)

export default usePrivacyStore
