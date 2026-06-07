import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { buttonVariants } from '@/components/ui/button'
import { Utensils, MessageSquare, Sparkles, ArrowRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">

        {/* Hero */}
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
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/55" />

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center mx-auto w-full max-w-6xl px-4 sm:px-6 py-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 px-3.5 py-1 text-xs font-medium text-white mb-6 animate-fade-in">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              Dành riêng cho sinh viên Hòa Lạc
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] animate-fade-in">
              Ăn ngon,{' '}
              <span className="text-amber-400">đúng ngân sách</span>
              <br />
              tại Hòa Lạc
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed animate-fade-in">
              Khám phá quán ăn, gian hàng sinh viên và đọc review thật từ cộng đồng.
              Tìm món phù hợp với trợ lý AI trong vài giây.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center animate-fade-in">
              <Link
                href="/explore"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-12 px-6 text-base font-medium gap-2'
                )}
              >
                <Utensils className="w-4 h-4" />
                Khám phá ẩm thực
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center h-12 px-6 text-base rounded-lg border border-white/60 text-white hover:bg-white/10 transition-colors"
                >
                  Đăng ký miễn phí
                </Link>
              )}
            </div>
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
