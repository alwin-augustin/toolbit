import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        applyTheme(newTheme)
        set({ theme: newTheme })
      },
    }),
    {
      name: 'toolbit-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately on rehydration
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

// Initialize theme on first load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('toolbit-theme')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.theme) {
        applyTheme(state.theme)
      }
    } catch {
      applyTheme('dark')
    }
  } else {
    applyTheme('dark')
  }
}
