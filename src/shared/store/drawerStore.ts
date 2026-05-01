// 드로워 상태 관리 스토어: 채팅 및 알림 드로워의 열림/닫힘 상태를 관리
import { create } from 'zustand'  // Zustand 상태 관리 라이브러리

// 드로워 탭 타입 정의
type DrawerTab = 'chat' | 'notification'  // 채팅 탭, 알림 탭

// 드로워 스토어 인터페이스: 상태 및 액션 함수 정의
interface DrawerStore {
  activeTab: DrawerTab | null      // 현재 활성화된 탭 (null은 닫힘 상태)
  lastTab: DrawerTab                // 마지막으로 열었던 탭 (다시 열 때 사용)
  activeChatRoomId: number | null  // 현재 열린 채팅방 ID
  pendingFirstMessage: string | null  // 채팅방 첫 진입 시 자동 전송할 메시지 (구매/대여 선택 안내)

  // 드로워 제어 함수들
  open: (tab: DrawerTab) => void                         // 특정 탭 열기
  openChatRoom: (roomId: number) => void                 // 특정 채팅방 열기
  closeChatRoom: () => void                             // 채팅방만 닫기
  close: () => void                                     // 드로워 전체 닫기
  toggle: (tab: DrawerTab) => void                      // 특정 탭 토글 (열려있으면 닫고, 닫혀있으면 열기)
  toggleOpen: () => void                                // 마지막 탭 기준으로 토글
  setPendingFirstMessage: (msg: string | null) => void  // 채팅방 자동 전송 메시지 설정
}

// 드로워 스토어 생성: Zustand를 사용한 전역 상태 관리
export const useDrawerStore = create<DrawerStore>((set) => ({
  // 초기 상태
  activeTab: null,             // 처음에는 닫힘 상태
  lastTab: 'chat',            // 기본 마지막 탭은 채팅
  activeChatRoomId: null,      // 열린 채팅방 없음
  pendingFirstMessage: null,   // 자동 전송 메시지 없음

  // 액션 함수들
  open: (tab) => set({ 
    activeTab: tab,          // 특정 탭 활성화
    lastTab: tab             // 마지막 탭 갱신
  }),
  
  openChatRoom: (roomId) => set({ 
    activeTab: 'chat',       // 채팅 탭 활성화
    lastTab: 'chat',         // 마지막 탭을 채팅으로 설정
    activeChatRoomId: roomId // 특정 채팅방 ID 설정
  }),
  
  closeChatRoom: () => set({ 
    activeChatRoomId: null   // 채팅방만 닫기 (탭은 유지)
  }),
  
  close: () => set({ 
    activeTab: null,         // 드로워 전체 닫기
    activeChatRoomId: null   // 채팅방도 닫기
  }),
  
  toggle: (tab) => set((s) => ({
    activeTab: s.activeTab === tab ? null : tab,  // 같은 탭이면 닫고, 다른 탭이면 열기
    lastTab: tab,                                   // 마지막 탭 갱신
    activeChatRoomId: s.activeTab === tab ? null : s.activeChatRoomId,  // 탭 토글 시 채팅방 상태 처리
  })),
  
  toggleOpen: () => set((s) => ({
    activeTab: s.activeTab !== null ? null : s.lastTab,  // 열려있으면 닫고, 닫혀있으면 마지막 탭 열기
    activeChatRoomId: s.activeTab !== null ? null : s.activeChatRoomId,  // 채팅방 상태도 함께 토글
  })),

  // 채팅방 진입 시 자동 전송할 첫 메시지 설정 (구매/대여 선택 안내용)
  setPendingFirstMessage: (msg) => set({ pendingFirstMessage: msg }),
}))
