// Applies the theme-hacker CSS class to <html> synchronously from localStorage
// before Vue mounts, so all components see the correct class on first render.
export default defineNuxtPlugin(() => {
  const STORAGE_KEY = 'quicknote:theme'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    document.documentElement.classList.toggle('theme-hacker', stored === 'hackerGreen')
  } catch {}
})
