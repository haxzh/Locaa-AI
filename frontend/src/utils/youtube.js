const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

const normalizeHost = (host) => host.toLowerCase().replace(/^www\./, '')

const extractFromPath = (path) => {
  const parts = path.split('/').filter(Boolean)
  if (!parts.length) return null

  if (['shorts', 'embed', 'live', 'v'].includes(parts[0]) && parts[1]) {
    return VIDEO_ID_RE.test(parts[1]) ? parts[1] : null
  }

  return VIDEO_ID_RE.test(parts[0]) ? parts[0] : null
}

export const extractYouTubeVideoId = (value) => {
  if (!value) return null
  const raw = value.trim()

  if (VIDEO_ID_RE.test(raw)) return raw

  const urlCandidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const parsed = new URL(urlCandidate)
    const host = normalizeHost(parsed.hostname)

    if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v')
        return VIDEO_ID_RE.test(v || '') ? v : null
      }
      return extractFromPath(parsed.pathname)
    }

    if (['youtu.be', 'm.youtu.be'].includes(host)) {
      return extractFromPath(parsed.pathname)
    }

    return null
  } catch {
    return null
  }
}

export const normalizeYouTubeUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`
