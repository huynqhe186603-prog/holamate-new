import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật - HolaMate',
  description: 'Chính sách bảo mật của HolaMate — cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            ← Về trang chủ
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-[#F97316]">Chính sách bảo mật</h1>
          <p className="mt-2 text-sm text-neutral-500">Ngày cập nhật: 11/06/2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Intro */}
          <p className="text-neutral-600 leading-relaxed">
            HolaMate (<strong>holamate.vn</strong>) cam kết bảo vệ quyền riêng tư của bạn.
            Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân
            khi bạn sử dụng nền tảng của chúng tôi.
          </p>

          <Section number={1} title="Thông tin chúng tôi thu thập">
            <ul className="space-y-2 text-neutral-600">
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span><strong>Thông tin tài khoản:</strong> Email, họ tên, ảnh đại diện — thu thập khi đăng ký trực tiếp hoặc qua Google OAuth.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span><strong>Nội dung người dùng tạo:</strong> Bài đánh giá (review), hình ảnh upload, lịch sử đặt món.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span><strong>Dữ liệu sử dụng:</strong> Các tính năng bạn dùng, tìm kiếm AI, thời gian truy cập — dùng để cải thiện dịch vụ.</span>
              </li>
            </ul>
          </Section>

          <Section number={2} title="Mục đích sử dụng thông tin">
            <ul className="space-y-2 text-neutral-600">
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span>Tạo và quản lý tài khoản của bạn trên HolaMate.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span>Hiển thị thông tin cá nhân, review và đơn hàng trong ứng dụng.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span>Cải thiện trải nghiệm người dùng và chất lượng gợi ý từ HolaMate AI.</span>
              </li>
            </ul>
          </Section>

          <Section number={3} title="Bảo mật dữ liệu">
            <ul className="space-y-2 text-neutral-600">
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span>Dữ liệu được lưu trữ an toàn trên <strong>Supabase</strong> với mã hóa at-rest và in-transit.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span>Chúng tôi <strong>không bán</strong> thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span>Chúng tôi <strong>không chia sẻ</strong> dữ liệu với các đối tác quảng cáo hay công ty phân tích bên ngoài.</span>
              </li>
            </ul>
          </Section>

          <Section number={4} title="Quyền của người dùng">
            <ul className="space-y-2 text-neutral-600">
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span><strong>Xem &amp; chỉnh sửa:</strong> Bạn có thể cập nhật thông tin cá nhân bất kỳ lúc nào trong trang Tài khoản.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span><strong>Xóa tài khoản:</strong> Bạn có quyền yêu cầu xóa toàn bộ dữ liệu cá nhân bằng cách liên hệ chúng tôi.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">·</span>
                <span><strong>Rút lại quyền Google:</strong> Bạn có thể thu hồi quyền truy cập của HolaMate trong phần cài đặt tài khoản Google bất kỳ lúc nào.</span>
              </li>
            </ul>
          </Section>

          <Section number={5} title="Liên hệ">
            <p className="text-neutral-600 leading-relaxed">
              Nếu bạn có câu hỏi hoặc yêu cầu về quyền riêng tư, hãy liên hệ với chúng tôi qua email:
            </p>
            <a
              href="mailto:huynqhe186603@fpt.edu.vn"
              className="mt-2 inline-block font-medium text-[#F97316] hover:underline underline-offset-4"
            >
              huynqhe186603@fpt.edu.vn
            </a>
          </Section>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          © 2026 HolaMate. Bảo lưu mọi quyền.
        </p>
      </div>
    </div>
  )
}

function Section({ number, title, children }: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-neutral-900 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-[#F97316] text-sm font-bold shrink-0">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}
