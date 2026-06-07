# CLAUDE.md — HolaMate Project

## Tổng quan dự án

**HolaMate** là nền tảng ẩm thực dành cho sinh viên khu vực Hòa Lạc (Hà Nội). Website giúp sinh viên:
- Khám phá quán ăn cố định và gian hàng sinh viên tự bán
- Đọc và viết review minh bạch từ cộng đồng
- Tìm món/quán bằng Trợ lý AI (ngôn ngữ tự nhiên)
- Gửi yêu cầu đặt món trực tiếp đến quán/người bán

**HolaMate KHÔNG vận hành đội shipper.** Nền tảng chỉ kết nối người mua và người bán.

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend/BaaS | Supabase (Database + Auth + Storage + Realtime + Edge Functions) |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (cho orders) |
| AI Assistant | Supabase Edge Functions → Claude/OpenAI API |
| Deploy | Vercel |

**Nguyên tắc cốt lõi:** Không có custom backend. Mọi logic đều qua Supabase BaaS (RLS, Triggers, Functions, Edge Functions).

---

## Cấu trúc thư mục

```
holamate/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Routes không cần auth
│   │   ├── page.tsx              # Trang chủ
│   │   ├── explore/              # Khám phá ẩm thực
│   │   │   ├── page.tsx          # Danh sách quán + gian hàng
│   │   │   ├── vendors/[id]/     # Chi tiết quán ăn
│   │   │   └── booths/[id]/      # Chi tiết gian hàng sinh viên
│   │   ├── reviews/              # Review cộng đồng
│   │   │   └── page.tsx
│   │   └── ai/                   # Trợ lý AI
│   │       └── page.tsx
│   ├── (auth)/                   # Routes cần đăng nhập
│   │   ├── account/              # Tài khoản người dùng
│   │   ├── orders/               # Đơn hàng của tôi
│   │   └── checkout/             # Đặt món
│   ├── seller/                   # Seller Dashboard
│   │   ├── dashboard/
│   │   ├── vendors/
│   │   ├── menu/
│   │   └── orders/
│   ├── admin/                    # Admin Dashboard
│   │   ├── dashboard/
│   │   ├── vendors/
│   │   ├── reviews/
│   │   ├── users/
│   │   └── media/
│   └── api/                      # Next.js API Routes (nếu cần)
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── shared/                   # Components dùng chung
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── VendorCard.tsx        # Card quán ăn
│   │   ├── BoothCard.tsx         # Card gian hàng sinh viên
│   │   ├── ReviewCard.tsx
│   │   ├── MenuItemCard.tsx
│   │   └── StarRating.tsx
│   ├── explore/                  # Components trang khám phá
│   ├── reviews/                  # Components review
│   ├── seller/                   # Components seller dashboard
│   └── admin/                    # Components admin
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   ├── server.ts             # Supabase server client (SSR)
│   │   └── middleware.ts         # Auth middleware
│   ├── hooks/                    # Custom React hooks
│   │   ├── useVendors.ts
│   │   ├── useReviews.ts
│   │   ├── useOrders.ts
│   │   └── useRealtime.ts        # Supabase Realtime hooks
│   └── utils/
│       ├── formatters.ts         # Format tiền VND, ngày giờ
│       └── validators.ts
├── types/
│   └── database.ts               # TypeScript types từ Supabase schema
├── middleware.ts                  # Next.js middleware (auth protection)
└── .env.local                    # Environment variables
```

---

## Database Schema (18 bảng)

### Nhóm Người dùng
```
profiles                    — Thông tin tài khoản (sync với Supabase Auth)
student_verifications       — Yêu cầu xác thực sinh viên
user_reports                — Report tài khoản bất thường
```

### Nhóm Người bán
```
sellers                     — Hồ sơ người bán
seller_vendor_roles         — Liên kết seller ↔ vendor (N-N)
```

### Nhóm Quán/Gian hàng
```
vendors                     — Quán ăn + gian hàng (vendor_type: fixed_shop | online_seller | student_booth)
menu_items                  — Món ăn / sản phẩm của từng vendor
```

### Nhóm Media
```
vendor_media                — Nhiều ảnh cho một vendor
menu_item_media             — Nhiều ảnh cho một menu_item
review_media                — Ảnh đính kèm review
```

### Nhóm Review
```
reviews                     — Review vendor hoặc menu_item (review_type: vendor | menu_item)
review_votes                — Vote mức độ hữu ích review (1-5 sao)
review_reports              — Report review có vấn đề
```

### Nhóm Đơn hàng
```
orders                      — Yêu cầu đặt món
order_items                 — Từng món trong đơn
```

### Nhóm Khác
```
saved_vendors               — Quán/gian hàng yêu thích
ai_search_logs              — Log câu hỏi Trợ lý AI
admin_logs                  — Lịch sử thao tác admin
```

---

## Quan hệ Database (ERD tóm tắt)

```
profiles ──< reviews
profiles ──< review_votes
profiles ──< orders
profiles ──< student_verifications
profiles ──< user_reports (reporter + reported)
profiles ──< saved_vendors

sellers >──< vendors  (qua seller_vendor_roles)

vendors ──< menu_items
vendors ──< reviews
vendors ──< vendor_media
vendors ──< orders

menu_items ──< reviews
menu_items ──< menu_item_media
menu_items ──< order_items

reviews ──< review_votes
reviews ──< review_reports
reviews ──< review_media

orders ──< order_items
```

---

## Các Enum / Giá trị cố định

### profiles
- `role`: `user` | `seller` | `admin`
- `user_type`: `normal_user` | `student_user`
- `status`: `active` | `suspended` | `banned` | `deleted`

### vendors
- `vendor_type`: `fixed_shop` | `online_seller` | `student_booth`
  - `fixed_shop`: Quán ăn cố định — có map, có giờ mở cửa, có địa chỉ
  - `online_seller`: Gian hàng giao hàng online — KHÔNG có map, KHÔNG có giờ mở cửa, liên hệ qua phone/Zalo
  - `student_booth`: Gian hàng sinh viên — KHÔNG có map, có thời gian bán, có điểm hẹn
- `status`: `pending` | `active` | `hidden` | `rejected` | `duplicate`
- `source`: `google_maps` | `manual` | `seller_submitted`

### menu_items
- `item_type`: `food` | `drink` | `combo` | `display_product`

### reviews
- `review_type`: `vendor` | `menu_item`
- `status`: `visible` | `hidden` | `pending` | `removed`

### orders
- `status`: `submitted` | `confirmed` | `completed` | `cancelled`
- `fulfillment_method`: `pickup` | `seller_delivery`

### media (vendor_media, menu_item_media, review_media)
- `status`: `visible` | `hidden` | `pending` | `removed`
- `media_type` (vendor_media): `cover` | `logo` | `menu` | `food` | `booth` | `signboard` | `space` | `other`

### sellers
- `seller_type`: `fixed_shop_owner` | `student_seller` | `both`
- `status`: `pending` | `active` | `rejected` | `suspended`

---

## Supabase Storage Buckets

| Bucket | Public | Dùng cho |
|---|---|---|
| `avatars` | Public | Avatar user, seller, admin |
| `seller-images` | Public | Ảnh bìa hồ sơ người bán |
| `vendor-images` | Public | Ảnh quán/gian hàng, menu, không gian |
| `menu-item-images` | Public | Ảnh món ăn / sản phẩm |
| `review-images` | Private (duyệt trước) | Ảnh đính kèm review |

**Cấu trúc đường dẫn:**
```
avatars/users/{user_id}/avatar.jpg
avatars/sellers/{seller_id}/avatar.jpg
vendor-images/vendors/{vendor_id}/cover.jpg
vendor-images/vendors/{vendor_id}/menu/menu_01.jpg
menu-item-images/vendors/{vendor_id}/items/{item_id}/main.jpg
review-images/reviews/{review_id}/photo_01.jpg
```

---

## Phân quyền (5 Roles)

| Role | Mô tả |
|---|---|
| **Guest** | Chưa đăng nhập — chỉ xem dữ liệu public |
| **User** | Đã đăng nhập — viết review, vote, đặt món, lưu quán |
| **Student User** | User đã xác thực sinh viên — độ tin cậy cao hơn |
| **Seller** | Người bán — quản lý vendor/menu/order của mình |
| **Admin** | Quản trị viên — full quyền toàn hệ thống |

**Nguyên tắc RLS quan trọng:**
- Public SELECT: chỉ dữ liệu `status = 'active'` hoặc `status = 'visible'`
- User chỉ INSERT/UPDATE dữ liệu có `user_id = auth.uid()`
- Seller chỉ UPDATE vendor/menu/order thuộc vendor mà seller quản lý (qua `seller_vendor_roles`)
- Review ẩn danh: `is_anonymous = true` ẩn `user_id` với cộng đồng, nhưng hệ thống vẫn lưu
- Một user không được vote review của chính mình
- Một user chỉ được vote 1 lần cho 1 review (UNIQUE constraint)

---

## Supabase Realtime

Bật Realtime cho các bảng sau:
- `orders` — để seller dashboard nhận đơn mới ngay lập tức
- `order_items` — cùng với orders

**Pattern sử dụng trong code:**
```typescript
// Trong seller dashboard
const channel = supabase
  .channel('new-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `vendor_id=eq.${vendorId}`
  }, (payload) => {
    // Hiển thị đơn mới
  })
  .subscribe()
```

---

## Supabase Client Setup

**Browser client** (`lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server client** (`lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, ... } }
  )
}
```

---

## Environment Variables (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Không commit service_role key lên git
```

---

## Sitemap & Routes

```
/                           Trang chủ
/explore                    Khám phá ẩm thực (tab: quán ăn | gian hàng sv)
/explore/vendors/[id]       Chi tiết quán ăn
/explore/booths/[id]        Chi tiết gian hàng sinh viên
/reviews                    Review cộng đồng
/reviews/write              Viết review
/ai                         Trợ lý AI
/checkout/[vendorId]        Đặt món
/account                    Tài khoản cá nhân
/account/orders             Lịch sử đơn hàng
/account/reviews            Review của tôi
/account/saved              Quán/gian hàng đã lưu
/account/verify-student     Xác thực sinh viên
/seller/dashboard           Seller dashboard
/seller/vendors             Quản lý quán/gian hàng
/seller/menu                Quản lý menu/sản phẩm
/seller/orders              Quản lý đơn hàng
/admin/dashboard            Admin dashboard
/admin/vendors              Quản lý vendors
/admin/reviews              Quản lý reviews
/admin/users                Quản lý users
/admin/media                Quản lý media
/admin/verifications        Quản lý xác thực sinh viên
```

---

## Các Workflow chính

### Workflow người dùng tìm quán (W1 + W2)
`Trang chủ → Khám phá ẩm thực → Lọc (loại món, giá, trạng thái, ship) → Trang chi tiết → Đặt món / Liên hệ / Viết review`

### Workflow Trợ lý AI (W3)
`Nhập câu tiếng Việt → Edge Function → Parse thành filters → Query Supabase → Trả về danh sách gợi ý`

### Workflow đặt món (W4)
`Trang chi tiết → Chọn món → Giỏ hàng → Nhập thông tin → Gửi đơn → Realtime notify seller`

### Workflow review (W6)
`Đăng nhập → Viết review (chọn: vendor hoặc menu_item) → Chấm sao → Nội dung → Ảnh → Ẩn danh/công khai → Submit`

### Workflow seller nhận đơn (W12)
`Realtime nhận đơn mới → Xem chi tiết → Xác nhận → Cập nhật trạng thái → Hoàn thành`

---

## Coding Conventions

### Naming
- Components: PascalCase (`VendorCard.tsx`)
- Hooks: camelCase bắt đầu bằng `use` (`useVendors.ts`)
- Utils: camelCase (`formatVND.ts`)
- Database queries: dùng Supabase JS client, KHÔNG dùng raw SQL ở frontend
- Types: đặt trong `types/database.ts`, generate từ Supabase CLI khi có thể

### Data fetching
- **Server Components**: dùng `createServerClient` để fetch data, tận dụng SSR cho SEO
- **Client Components**: dùng `createBrowserClient` cho Realtime và interactive features
- Trang danh sách vendor → Server Component (SEO quan trọng)
- Seller dashboard → Client Component (Realtime)

### Tiền tệ
- Lưu trong DB: đơn vị **VND (integer)**, ví dụ `25000`
- Hiển thị: format `25.000đ` hoặc `25k`

### Ảnh
- Luôn lưu cả `image_url` (full URL) và `storage_path` (relative path trong bucket)
- `image_url` dùng để hiển thị nhanh (`<Image src={image_url} />`)
- `storage_path` dùng để xóa/thay thế file trong Storage

### Bản đồ
- Hiển thị bản đồ CHỈ trong trang chi tiết vendor/booth, KHÔNG hiển thị toàn bộ trên listing page
- Dùng `latitude` + `longitude` từ bảng `vendors`

---

## Edge Cases quan trọng

1. **Review ẩn danh**: `is_anonymous = true` → hiển thị "Người dùng ẩn danh", nhưng backend vẫn lưu `user_id`
2. **Vote tự mình**: Không cho vote review của `user_id = auth.uid()`, check ở cả frontend và RLS
3. **Gian hàng sinh viên vs Quán ăn**: Phân biệt bằng `vendor_type`. UI card và trang chi tiết khác nhau
4. **Món theo ngày**: `menu_items.selling_date` — chỉ hiển thị nếu `selling_date = today` hoặc `null`
5. **Quán đang mở**: `vendors.opening_hours` — parse để check trạng thái hiện tại
6. **Ảnh review pending**: Không hiển thị `review_media` có `status = 'pending'` với cộng đồng
7. **Seller dashboard Realtime**: Unsubscribe channel khi component unmount để tránh memory leak

---

## Thứ tự build đề xuất

```
Phase 1: Foundation
  ✅ Supabase schema + RLS policies
  [ ] Next.js project setup + Supabase client
  [ ] Auth flow (đăng nhập / đăng ký / Google OAuth)
  [ ] Middleware bảo vệ routes

Phase 2: Core public pages
  [ ] Trang chủ
  [ ] Trang khám phá (danh sách vendor + filter)
  [ ] Trang chi tiết vendor
  [ ] Trang chi tiết gian hàng sinh viên

Phase 3: Review system
  [ ] Trang review cộng đồng
  [ ] Viết review + upload ảnh
  [ ] Vote review
  [ ] Report review

Phase 4: Order flow
  [ ] Giỏ hàng + Checkout
  [ ] Lịch sử đơn hàng (user)

Phase 5: Seller dashboard
  [ ] Quản lý vendor/menu
  [ ] Quản lý đơn hàng + Realtime
  [ ] Upload ảnh

Phase 6: Account & Verification
  [ ] Hồ sơ cá nhân
  [ ] Xác thực sinh viên
  [ ] Quán/gian hàng đã lưu

Phase 7: Admin dashboard
  [ ] Duyệt vendor, review, media
  [ ] Quản lý users + report
  [ ] Thống kê

Phase 8: AI Assistant
  [ ] Edge Function kết nối Claude/OpenAI
  [ ] Giao diện chat Trợ lý AI
```

---

## Lưu ý khi làm việc với Claude Code

- Khi tạo Supabase query, LUÔN dùng `@supabase/ssr` package, không dùng `@supabase/supabase-js` trực tiếp ở Server Components
- Khi generate TypeScript types, chạy: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts`
- Khi cần test RLS, dùng Supabase Dashboard → Table Editor → RLS Policies
- Realtime chỉ dùng ở Client Components, không dùng ở Server Components
- Storage upload: dùng `supabase.storage.from('bucket-name').upload(path, file)` rồi lấy public URL
- Tên bucket phải khớp chính xác: `avatars`, `seller-images`, `vendor-images`, `menu-item-images`, `review-images`
