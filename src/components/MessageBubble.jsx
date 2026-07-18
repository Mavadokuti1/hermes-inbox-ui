import { User } from 'lucide-react'
import { splitThinking } from '../lib/thinking'
import ThinkingPanel from './ThinkingPanel'
import Markdown from './Markdown'

// A single chat message row. User messages are accent-colored bubbles aligned
// right; assistant messages are light/glass bubbles aligned left, preceded by a
// collapsible "Agent Thinking…" panel when reasoning tokens are present.
export default function MessageBubble({ role, content, error, accent, agent, streaming }) {
  const isUser = role === 'user'
  const AgentIcon = agent?.icon
  const { reasoning, answer, thinking } = isUser
    ? { reasoning: '', answer: content, thinking: false }
    : splitThinking(content)

  const avatarClass = isUser
    ? accent?.avatar || 'bg-[#7A5FC9] text-white dark:bg-[#0B66E4]'
    : 'border border-black/5 bg-white/70 text-navy dark:border-white/10 dark:bg-white/10 dark:text-white'

  // SureThing chat spec: user bubbles violet (light) / blue (dark);
  // assistant bubbles white (light) / translucent white (dark).
  const userBubbleClass = 'bg-[#7A5FC9] text-white dark:bg-[#0B66E4]'

  const showAnswerBubble = isUser || answer || (streaming && !thinking) || error

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${avatarClass}`}>
        {isUser ? <User size={16} /> : AgentIcon ? <AgentIcon size={16} /> : null}
      </div>

      <div className="flex max-w-[80%] flex-col">
        {!isUser && <ThinkingPanel reasoning={reasoning} thinking={thinking} />}

        {showAnswerBubble && (
          <div
            className={`break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
              isUser
                ? `whitespace-pre-wrap rounded-tr-sm ${userBubbleClass}`
                : error
                  ? 'whitespace-pre-wrap rounded-tl-sm border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
                  : 'rounded-tl-sm bg-white text-gray-900 ring-1 ring-black/5 dark:bg-white/10 dark:text-white dark:ring-white/10'
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
