import { create } from 'zustand'

type DrawerTab = 'chat' | 'notification'

interface DrawerStore {
  activeTab: DrawerTab | null
  open: (tab: DrawerTab) => void
  close: () => void
  toggle: (tab: DrawerTab) => void
}

export const useDrawerStore = create<DrawerStore>((set, get) => ({
  activeTab: null,
  open:   (tab) => set({ activeTab: tab }),
  close:  ()    => set({ activeTab: null }),
  toggle: (tab) => set({ activeTab: get().activeTab === tab ? null : tab }),
}))
