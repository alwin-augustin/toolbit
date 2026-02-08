import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SidebarMode = 'expanded' | 'collapsed'

interface SidebarState {
  isOpen: boolean
  mode: SidebarMode
  toggle: () => void
  close: () => void
  setMode: (mode: SidebarMode) => void
  toggleMode: () => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      mode: 'collapsed' as SidebarMode,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      close: () => set({ isOpen: false }),
      setMode: (mode: SidebarMode) => set({ mode }),
      toggleMode: () => set((state) => ({
        mode: state.mode === 'expanded' ? 'collapsed' : 'expanded',
      })),
    }),
    {
      name: 'sidebar-state',
    }
  )
)
