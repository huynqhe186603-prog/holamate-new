'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Sparkles, RotateCcw, X, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VendorCard, BoothCard, OnlineSellerCard } from '@/components/explore/VendorCard'
import type { VendorWithRating } from '@/lib/utils/explore'

type ChatHistoryItem = { role: 'user' | 'assistant'; content: string }

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

const SUGGESTIONS = [
  'Mình có 35k, muốn ăn no',
  'Quán cơm gần KTX có ship không?',
  'Trà sữa ngon dưới 30k',
]

export function AiChatClient() {
  const [messages, setMessages]           = useState<Message[]>([])
  const [chatHistory, setChatHistory]     = useState<ChatHistoryItem[]>([])
  const [input, setInput]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [userLocation, setUserLocation]   = useState<{ lat: number; lng: number } | null>(null)
  const [sessionSummary, setSessionSummary] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const supabase  = createClient()

  // Silent GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  // Summarize every 6 messages to keep context compact
  useEffect(() => {
    if (chatHistory.length === 0 || chatHistory.length % 6 !== 0) return
    const slice = chatHistory.slice(-12)
    supabase.functions.invoke('ai-assistant', {
      body: { mode: 'summarize', messages: slice },
    }).then(({ data }) => {
      if (data?.summary) setSessionSummary(data.summary)
    }).catch(() => {})
  }, [chatHistory.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleReset = useCallback(() => {
    setMessages([])
    setChatHistory([])
    setInput('')
    setSessionSummary('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const handleSend = useCallback(async (query: string) => {
    const q = query.trim()
    if (!q || loading) return

    const newHistory = chatHistory.slice(-10)

    setMessages(prev => [...prev, { role: 'user', content: q }])
    setChatHistory(prev => ([...prev, { role: 'user' as const, content: q }] as ChatHistoryItem[]).slice(-20))
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: q,
          messages: newHistory,
          userLat: userLocation?.lat ?? null,
          userLng: userLocation?.lng ?? null,
          sessionSummary,
        },
      })

      if (error) throw error

      const explanation = data?.explanation ?? 'Đây là các gợi ý mình tìm được cho bạn!'

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: explanation, vendors: data?.vendors ?? [] },
      ])
      setChatHistory(prev =>
        ([...prev, { role: 'assistant' as const, content: explanation }] as ChatHistoryItem[]).slice(-20)
      )
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
  }, [loading, chatHistory, supabase, userLocation, sessionSummary])

  const isEmpty = messages.length === 0
  const exchangeCount = Math.floor(chatHistory.length / 2)

  return (
    <div className="relative">
      {/* Messages / Welcome area */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 min-h-[calc(100vh-140px)]">
        {isEmpty ? (
          <WelcomeScreen onSuggestion={handleSend} />
        ) : (
          <div className="space-y-4">
            {/* Top bar: context indicator + reset */}
            <div className="flex items-center justify-between">
              {exchangeCount > 0 ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                  💬 Đang nhớ {exchangeCount} tin
                  <button
                    onClick={handleReset}
                    className="ml-0.5 hover:text-amber-900 transition-colors"
                    aria-label="Xóa lịch sử"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded-full px-3 py-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Cuộc trò chuyện mới
              </button>
            </div>

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
          {userLocation && (
            <div className="flex items-center gap-1 mb-1.5">
              <MapPin className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">Đã lấy vị trí của bạn</span>
            </div>
          )}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(input) }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Hỏi HolaMate AI về quán ăn..."
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

function WelcomeScreen({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-2">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shadow-sm">
        <Sparkles className="w-7 h-7 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-neutral-900">Xin chào! Tôi là HolaMate AI 👋</h2>
        <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
          Mình có thể giúp bạn tìm quán ăn phù hợp ở Hòa Lạc.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 mt-1">
        <p className="text-xs text-neutral-400 mb-1">Thử hỏi mình:</p>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-sm text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors"
          >
            {s}
          </button>
        ))}
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
              const Card =
                v.vendor_type === 'fixed_shop' ? VendorCard :
                v.vendor_type === 'online_seller' ? OnlineSellerCard :
                BoothCard
              const href = v.vendor_type === 'fixed_shop'
                ? `/explore/vendors/${v.id}`
                : `/explore/booths/${v.id}`
              return (
                <div key={v.id}>
                  <Card vendor={v} href={href} />
                  {v.distance_km != null && (
                    <div className="mt-1 flex justify-start pl-1">
                      <span
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100"
                        title="Khoảng cách ước tính đường chim bay. Xem bản đồ để biết đường đi thực tế"
                      >
                        <MapPin className="w-3 h-3" />
                        ~{v.distance_km}km
                      </span>
                    </div>
                  )}
                </div>
              )
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
