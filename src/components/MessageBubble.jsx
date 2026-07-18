import { User } from 'lucide-react'
import { splitThinking } from '../lib/thinking'
import ThinkingPanel from './ThinkingPanel'
import Markdown from './Markdown'

// A single chat message row. User messages are solid dark bubbles aligned
// right; assistant messages are flat white bubbles aligned left, preceded by a
// collapsible "Agent Thinking…" panel when reasoning tokens are present.
export default function MessageBubble({ role, content, error, accent, agent, streaming }) {
  const isUser = role === 'user'
  const AgentIcon = agent?.icon
  const { reasoning, answer, thinking } = isUser
    ? { reasoning: '', answer: content, thinking: false }
    : splitThinking(content)

  // Manus: monochrome avatars. User = solid dark (inverts in dark mode);
  // assistant = flat bordered square.
  const avatarClass = isUser
    ? 'bg-[#1A1A19] text-white dark:bg-white dark:text-[#1A1A19]'
    : 'border border-line bg-white text-ink dark:border-white/10 dark:bg-[#232221] dark:text-white'

  // Manus chat spec: user bubbles solid dark (inverted in dark); assistant
  // bubbles flat white with a hairline border.
  const userBubbleClass = 'bg-[#1A1A19] text-white dark:bg-white dark:text-[#1A1A19]'

  const showAnswerBubble = isUser || answer || (streaming && !thinking) || error

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${avatarClass}`}>
        {isUser ? <User size={16} /> : AgentIcon ? <AgentIcon size={16} /> : null}
      </div>

      <div className="flex max-w-[80%] flex-col">
        {!isUser && <ThinkingPanel reasoning={reasoning} thinking={thinking} />}

        {showAnswerBubble && (
          <div
            className={`break-words rounded-lg px-4 py-2.5 text-[15px] leading-relaxed ${
              isUser
                ? `whitespace-pre-wrap ${userBubbleClass}`
                : error
                  ? 'whitespace-pre-wrap border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-300'
                  : 'border border-line bg-white text-ink dark:border-white/10 dark:bg-[#232221] dark:text-white'
            }`}
          >
            {isUser || error ? (
              answer
            ) : (
              <>
                {answer && <Markdown text={answer} className="md-chat" />}
                {streaming && !thinking && <span className="stream-caret" />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
