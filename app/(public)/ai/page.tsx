import type { Metadata } from 'next'
import { AiChatClient } from './_components/AiChatClient'

export const metadata: Metadata = {
  title: 'Trợ lý AI',
  description: 'Hỏi Trợ lý AI về quán ăn và gian hàng sinh viên khu Hòa Lạc.',
}

export default function AiPage() {
  return <AiChatClient />
}
