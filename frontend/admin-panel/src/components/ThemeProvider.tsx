import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore(s => s.theme)

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') { root.classList.add('dark'); return }
    if (theme === 'light') { root.classList.remove('dark'); return }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (e: MediaQueryList | MediaQueryListEvent) => {
      root.classList.toggle('dark', e.matches)
    }
    apply(mq)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  return <>{children}</>
}
