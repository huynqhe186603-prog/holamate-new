'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VendorCard, BoothCard } from '@/components/explore/VendorCard'
import type { VendorWithRating } from '@/lib/utils/explore'

type UserMessage = {
  role: 'user'
  content: string
}

type AIMessage = {
  role: 'assistant'
  content: string
  vendors: VendorWithRating[]
}

type Message = UserMessage | AIMessage

export function AiChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = useCallback(async (query: string) => {
    const q = query.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { query: q },
      })

      if (error) throw error

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data?.explanation ?? 'Đây là các gợi ý mình tìm được cho bạn!',
          vendors: data?.vendors ?? [],
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, mình không tìm được kết quả ngay lúc này. Thử lại sau nhé!',
          vendors: [],
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [loading, supabase])

  const isEmpty = messages.length === 0

  return (
    <div className="relative">
      {/* Messages / Welcome area */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 min-h-[calc(100vh-140px)]">
        {isEmpty ? (
          <WelcomeScreen />
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && <ThinkingBubble />}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Fixed bottom input */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-t border-neutral-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSend(input)
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Hỏi tôi về quán ăn, món ngon..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 disabled:opacity-60 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-2">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shadow-sm">
        <Sparkles className="w-7 h-7 text-amber-500" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold text-neutral-900">Trợ lý Ẩm thực Hòa Lạc</h2>
        <p className="text-sm text-neutral-500 max-w-xs">
          Hỏi tôi về quán ăn, món ngon khu Hòa Lạc
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
          <Bot className="w-4 h-4 text-amber-600" />
        </div>
      )}

      <div className="max-w-[85%] space-y-3">
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-amber-500 text-white rounded-tr-sm ml-auto'
              : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-sm'
          }`}
        >
          {msg.content}
        </div>

        {!isUser && (msg as AIMessage).vendors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(msg as AIMessage).vendors.slice(0, 6).map(v => {
              const Card = v.vendor_type === 'fixed_shop' ? VendorCard : BoothCard
              const href = v.vendor_type === 'fixed_shop'
                ? `/explore/vendors/${v.id}`
                : `/explore/booths/${v.id}`
              return <Card key={v.id} vendor={v} href={href} />
            })}
          </div>
        )}

        {!isUser && (msg as AIMessage).vendors.length === 0 &&
          !msg.content.includes('không tìm được') && (
          <p className="text-xs text-neutral-400 px-1">
            Không tìm thấy quán phù hợp. Thử mô tả cụ thể hơn nhé!
          </p>
        )}
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
        <Bot className="w-4 h-4 text-amber-600" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-neutral-200 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
