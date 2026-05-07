/**
 * Safely open a URL in a new tab.
 * Only allows relative paths (/...) and http/https URLs.
 */
export function safeOpenUrl(url: string | null | undefined): void {
  if (!url) return
  const isRelative = url.startsWith('/')
  const isHttp = url.startsWith('http://') || url.startsWith('https://')
  if (!isRelative && !isHttp) return
  window.open(url, '_blank', 'noopener,noreferrer')
}
