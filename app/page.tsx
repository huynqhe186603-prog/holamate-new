import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { Utensils, UtensilsCrossed, MessageSquare, Sparkles, ArrowRight, Star, ChevronDown } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar />
      <main>

        {/* Hero — full viewport */}
        <section className="relative overflow-hidden min-h-screen flex flex-col">
          {/* Background image */}
          <Image
            src="/background.jpg"
            alt="Background"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/70" />

          {/* Center content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-24 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-1.5 text-sm font-medium text-white mb-8">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Dành riêng cho sinh viên Hòa Lạc
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight mb-6">
              Ăn ngon,{' '}
              <span className="text-amber-400">đúng ngân sách</span>
              <br />
              tại Hòa Lạc
            </h1>

            {/* Subtext */}
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10">
              Khám phá quán ăn, gian hàng sinh viên và đọc review thật từ cộng đồng.
              Tìm món phù hợp với trợ lý AI trong vài giây.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-white px-10 py-4 text-lg font-semibold hover:bg-primary/90 hover:scale-105 transition-all shadow-lg"
              >
                <Utensils className="w-5 h-5" />
                Khám phá ẩm thực
                <ArrowRight className="w-5 h-5" />
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full border border-white/60 text-white px-10 py-4 text-lg font-semibold hover:bg-white/10 hover:scale-105 transition-all"
                >
                  Đăng ký miễn phí
                </Link>
              )}
            </div>

            {/* Scroll indicator */}
            <ChevronDown className="w-6 h-6 text-white/60 animate-bounce" />
          </div>

          {/* Glassmorphism cards — bottom of hero */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: UtensilsCrossed,
                  title: 'Khám phá ẩm thực',
                  desc: '20+ quán ăn và gian hàng sinh viên quanh Hòa Lạc — lọc theo món, giá, có ship',
                  href: '/explore',
                },
                {
                  icon: MessageSquare,
                  title: 'Review minh bạch',
                  desc: 'Đánh giá thật từ sinh viên — không seeding, không fake',
                  href: '/reviews',
                },
                {
                  icon: Sparkles,
                  title: 'HolaMate AI',
                  desc: "Hỏi: 'Mình có 35k, muốn ăn cơm' — AI gợi ý quán phù hợp ngay",
                  href: '/ai',
                },
              ].map(({ icon: Icon, title, desc, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white hover:bg-white/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
