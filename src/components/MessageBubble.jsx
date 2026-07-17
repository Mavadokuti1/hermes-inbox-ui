import { User } from 'lucide-react'
import { splitThinking } from '../lib/thinking'
import ThinkingPanel from './ThinkingPanel'
import Markdown from './Markdown'

// A single chat message row. User messages are accent-colored bubbles aligned
// right; assistant messages are white bubbles aligned left, preceded by a
// collapsible "Agent Thinking…" panel when reasoning tokens are present.
export default function MessageBubble({ role, content, error, accent, agent, streaming }) {
  const isUser = role === 'user'
  const AgentIcon = agent?.icon
  const { reasoning, answer, thinking } = isUser
    ? { reasoning: '', answer: content, thinking: false }
    : splitThinking(content)

  const avatarClass = isUser
    ? accent?.avatar || 'bg-indigo-600 text-white'
    : 'border border-gray-200 bg-white text-gray-500'

  const userBubbleClass = accent?.userBubble || 'bg-indigo-600 text-white'

  // While streaming, show a caret even before the answer text arrives.
  const showAnswerBubble = isUser || answer || (streaming && !thinking) || error

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarClass}`}>
        {isUser ? <User size={16} /> : AgentIcon ? <AgentIcon size={16} /> : null}
      </div>

      <div className="flex max-w-[78%] flex-col">
        {!isUser && <ThinkingPanel reasoning={reasoning} thinking={thinking} />}

        {showAnswerBubble && (
          <div
            className={`break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
              isUser
                ? `whitespace-pre-wrap rounded-tr-sm ${userBubbleClass}`
                : error
                  ? 'whitespace-pre-wrap rounded-tl-sm border border-red-200 bg-red-50 text-red-700'
                  : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800'
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
