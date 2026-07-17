// Catalog of business toolkits shown in the Integrations Hub. Slugs match
// Composio toolkit slugs (used by the backend connect endpoints and by each
// agent's `toolkits` list in agents.js).
import { Mail, Github, Twitter, Linkedin, Slack, FileText, StickyNote } from 'lucide-react'

export const TOOLKITS = [
  { slug: 'gmail', name: 'Gmail', icon: Mail, blurb: 'Send & manage email', color: 'text-rose-400' },
  { slug: 'github', name: 'GitHub', icon: Github, blurb: 'Repos, issues, PRs', color: 'text-zinc-100' },
  { slug: 'twitter', name: 'Twitter / X', icon: Twitter, blurb: 'Post & engage', color: 'text-sky-400' },
  { slug: 'linkedin', name: 'LinkedIn', icon: Linkedin, blurb: 'Professional network', color: 'text-blue-400' },
  { slug: 'slack', name: 'Slack', icon: Slack, blurb: 'Team messaging', color: 'text-violet-400' },
  { slug: 'notion', name: 'Notion', icon: StickyNote, blurb: 'Docs & databases', color: 'text-zinc-100' },
  { slug: 'googledocs', name: 'Google Docs', icon: FileText, blurb: 'Documents', color: 'text-blue-300' },
]

export function getToolkit(slug) {
  return TOOLKITS.find((t) => t.slug === slug) || { slug, name: slug, icon: FileText, color: 'text-zinc-300' }
}

// Reduce the backend connection list to a status per toolkit slug.
export function connectionStatus(connections, slug) {
  const match = (connections || []).filter((c) => c.toolkit === slug)
  const has = (states) => match.some((c) => states.includes(String(c.status || '').toUpperCase()))
  if (has(['ACTIVE'])) return 'active'
  if (has(['INITIALIZING', 'INITIATED', 'PENDING'])) return 'pending'
  return 'disconnected'
}
