'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-transparent hover:bg-accent hover:text-accent-foreground">
        <span className="sr-only">Toggle theme</span>
        <div className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <span className="sr-only">Toggle theme</span>
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  )
}