import { create } from 'zustand'

export type TxStatus = 'none' | 'reserved' | 'completed'

interface TransactionStore {
  statusByRoom: Record<number, TxStatus>
  useEscrowByRoom: Record<number, boolean>
  setStatus: (roomId: number, status: TxStatus) => void
  setUseEscrow: (roomId: number, val: boolean) => void
  getStatus: (roomId: number) => TxStatus
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  statusByRoom: {},
  useEscrowByRoom: {},
  setStatus: (roomId, status) =>
    set((s) => ({ statusByRoom: { ...s.statusByRoom, [roomId]: status } })),
  setUseEscrow: (roomId, val) =>
    set((s) => ({ useEscrowByRoom: { ...s.useEscrowByRoom, [roomId]: val } })),
  getStatus: (roomId) => get().statusByRoom[roomId] ?? 'none',
}))
