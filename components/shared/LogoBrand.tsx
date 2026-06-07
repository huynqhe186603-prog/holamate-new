import Image from 'next/image'
import Link from 'next/link'

export function LogoBrand({
  size = 36,
  showText = true,
}: {
  size?: number
  showText?: boolean
}) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image
          src="/logo-icon.png"
          alt="HolaMate"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className="text-2xl font-bold tracking-tight text-neutral-900">
          HolaMate
        </span>
      )}
    </Link>
  )
}
