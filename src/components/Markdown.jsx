import { useMemo } from 'react'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

// Lightweight Markdown renderer for Memory Vault note previews.
// Notes are the user's own content, so we render the parsed HTML directly and
// lean on Tailwind's `prose`-style utility classes defined in index.css.
export default function Markdown({ text, className = '' }) {
  const html = useMemo(() => marked.parse(text || ''), [text])
  return (
    <div
      className={`md-body ${className}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
