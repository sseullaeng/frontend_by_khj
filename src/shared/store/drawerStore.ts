import { create } from 'zustand'

type DrawerTab = 'chat' | 'notification'

interface DrawerStore {
  activeTab: DrawerTab | null
  lastTab: DrawerTab
  activeChatRoomId: number | null
  open: (tab: DrawerTab) => void
  openChatRoom: (roomId: number) => void
  closeChatRoom: () => void
  close: () => void
  toggle: (tab: DrawerTab) => void
  toggleOpen: () => void
}

export const useDrawerStore = create<DrawerStore>((set) => ({
  activeTab: null,
  lastTab: 'chat',
  activeChatRoomId: null,
  open: (tab) => set({ activeTab: tab, lastTab: tab }),
  openChatRoom: (roomId) => set({ activeTab: 'chat', lastTab: 'chat', activeChatRoomId: roomId }),
  closeChatRoom: () => set({ activeChatRoomId: null }),
  close: () => set({ activeTab: null, activeChatRoomId: null }),
  toggle: (tab) => set((s) => ({
    activeTab: s.activeTab === tab ? null : tab,
    lastTab: tab,
    activeChatRoomId: s.activeTab === tab ? null : s.activeChatRoomId,
  })),
  toggleOpen: () => set((s) => ({
    activeTab: s.activeTab !== null ? null : s.lastTab,
    activeChatRoomId: s.activeTab !== null ? null : s.activeChatRoomId,
  })),
}))
