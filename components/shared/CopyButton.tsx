'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-primary transition-colors"
      aria-label="Sao chép địa chỉ"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Đã sao chép' : 'Sao chép'}
    </button>
  )
}
