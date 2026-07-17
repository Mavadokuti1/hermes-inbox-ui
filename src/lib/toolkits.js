// Helpers for the Integrations Hub. The app catalog is now fetched dynamically
// from Composio (1,000+ apps) via the backend proxy, so there is no hardcoded
// app list here anymore — just status derivation and the stable logo URL.

// Composio serves a logo per toolkit slug at a stable URL.
export function logoFor(slug) {
  return `https://logos.composio.dev/api/${encodeURIComponent(slug)}`
}

// Reduce the backend connection list to a status for a given toolkit slug.
export function connectionStatus(connections, slug) {
  const match = (connections || []).filter((c) => c.toolkit === slug)
  const has = (states) => match.some((c) => states.includes(String(c.status || '').toUpperCase()))
  if (has(['ACTIVE'])) return 'active'
  if (has(['INITIALIZING', 'INITIATED', 'PENDING'])) return 'pending'
  return 'disconnected'
}

// Slugs of every toolkit the entity has an ACTIVE connection for.
export function connectedSlugs(connections) {
  const set = new Set()
  for (const c of connections || []) {
    if (String(c.status || '').toUpperCase() === 'ACTIVE' && c.toolkit) set.add(c.toolkit)
  }
  return [...set]
}
