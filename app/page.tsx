import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { Utensils, MessageSquare, Sparkles, ArrowRight, Star, ChevronDown } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* Hero */}
        <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center">
          {/* Background image */}
          <Image
            src="/background.jpg"
            alt="Background"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Gradient overlay — đậm trên/dưới, nhạt giữa */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

          {/* Content */}
          <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center flex flex-col items-center gap-6">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-1.5 text-sm font-medium text-white">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Dành riêng cho sinh viên Hòa Lạc
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Ăn ngon,{' '}
              <span className="text-amber-400">đúng ngân sách</span>
              <br />
              tại Hòa Lạc
            </h1>

            {/* Subtext */}
            <p className="text-lg text-white/80 max-w-xl leading-relaxed">
              Khám phá quán ăn, gian hàng sinh viên và đọc review thật từ cộng đồng.
              Tìm món phù hợp với trợ lý AI trong vài giây.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-white px-8 py-4 text-lg font-semibold hover:bg-primary/90 hover:scale-105 transition-all shadow-lg"
              >
                <Utensils className="w-5 h-5" />
                Khám phá ẩm thực
                <ArrowRight className="w-5 h-5" />
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 text-white px-8 py-4 text-lg font-semibold hover:bg-white/10 hover:scale-105 transition-all"
                >
                  Đăng ký miễn phí
                </Link>
              )}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60 animate-bounce">
            <ChevronDown className="w-6 h-6" />
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Utensils,
                title: 'Khám phá ẩm thực',
                desc: 'Quán ăn cố định và gian hàng sinh viên quanh Hòa Lạc — lọc theo món, giá, có ship.',
                href: '/explore',
              },
              {
                icon: MessageSquare,
                title: 'Review minh bạch',
                desc: 'Đánh giá thật từ sinh viên — không seeding, không fake. Vote review hữu ích.',
                href: '/reviews',
              },
              {
                icon: Sparkles,
                title: 'Trợ lý AI',
                desc: '"Mình có 35k, muốn ăn no gần KTX" — AI hiểu và gợi ý ngay.',
                href: '/ai',
              },
            ].map(({ icon: Icon, title, desc, href }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1.5">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
