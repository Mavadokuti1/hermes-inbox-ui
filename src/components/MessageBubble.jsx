import { Bot, User } from 'lucide-react'

// A single chat message row. User messages are indigo bubbles aligned right,
// assistant messages are white bubbles aligned left.
export default function MessageBubble({ role, content, error }) {
  const isUser = role === 'user'

  return (
    <div className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-indigo-600 text-white' : 'border border-gray-200 bg-white text-gray-500'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div
        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-tr-sm bg-indigo-600 text-white'
            : error
              ? 'rounded-tl-sm border border-red-200 bg-red-50 text-red-700'
              : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
