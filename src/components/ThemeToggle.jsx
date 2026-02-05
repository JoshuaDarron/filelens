import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title="Toggle theme"
    >
      <i className="bi bi-moon-fill theme-icon-dark"></i>
      <i className="bi bi-brightness-high-fill theme-icon-light"></i>
    </button>
  )
}
