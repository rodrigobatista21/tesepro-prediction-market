'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'tesepro-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    const stored = localStorage.getItem(storageKey) as Theme | null
    return stored || defaultTheme
  })

  const [mounted, setMounted] = useState(false)

  // Calculate resolved theme synchronously
  const resolvedTheme = mounted ? resolveTheme(theme) : 'light'

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    const resolved = resolveTheme(newTheme)
    root.classList.add(resolved)
  }, [])

  // Initialize on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    applyTheme(theme)
  }, [theme, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted, applyTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }, [storageKey])

  const value: ThemeProviderState = {
    theme,
    resolvedTheme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
