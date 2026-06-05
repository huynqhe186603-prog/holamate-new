-- ===========================================
-- HolaMate Storage Buckets & Policies
-- ===========================================

-- ========================================
-- 1. CREATE BUCKETS
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'seller-images',
    'seller-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'vendor-images',
    'vendor-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'menu-item-images',
    'menu-item-images',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'review-images',
    'review-images',
    false,    -- private, cần duyệt trước khi hiển thị
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- 2. STORAGE POLICIES — avatars (public)
-- Path: avatars/users/{user_id}/...
--       avatars/sellers/{seller_id}/...
-- ========================================

DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_insert"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_update"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_delete"   ON storage.objects;

-- Public read (bucket is public)
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Upload vào folder của mình
CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (
      -- users/{user_id}/avatar.jpg
      (
        (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      -- sellers/{seller_id}/avatar.jpg
      (
        (storage.foldername(name))[1] = 'sellers'
        AND EXISTS (
          SELECT 1 FROM public.sellers
          WHERE sellers.user_id = auth.uid()
            AND sellers.id::text = (storage.foldername(name))[2]
        )
      )
    )
  );

-- Update ảnh của mình
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (
      (
        (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR (
        (storage.foldername(name))[1] = 'sellers'
        AND EXISTS (
          SELECT 1 FROM public.sellers
          WHERE sellers.user_id = auth.uid()
            AND sellers.id::text = (storage.foldername(name))[2]
        )
      )
    )
  );

-- Delete ảnh của mình
CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (
      (
        (storage.foldername(name))[1] = 'users'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR (
        (storage.foldername(name))[1] = 'sellers'
        AND EXISTS (
          SELECT 1 FROM public.sellers
          WHERE sellers.user_id = auth.uid()
            AND sellers.id::text = (storage.foldername(name))[2]
        )
      )
    )
  );

-- ========================================
-- 3. STORAGE POLICIES — seller-images (public)
-- Path: seller-images/sellers/{seller_id}/...
-- ========================================

DROP POLICY IF EXISTS "seller_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "seller_images_seller_insert"  ON storage.objects;
DROP POLICY IF EXISTS "seller_images_seller_update"  ON storage.objects;
DROP POLICY IF EXISTS "seller_images_seller_delete"  ON storage.objects;

CREATE POLICY "seller_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'seller-images');

CREATE POLICY "seller_images_seller_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'seller-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'sellers'
    AND EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.user_id = auth.uid()
        AND sellers.id::text = (storage.foldername(name))[2]
        AND sellers.status = 'active'
    )
  );

CREATE POLICY "seller_images_seller_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'seller-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'sellers'
    AND EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.user_id = auth.uid()
        AND sellers.id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "seller_images_seller_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'seller-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'sellers'
    AND EXISTS (
      SELECT 1 FROM public.sellers
      WHERE sellers.user_id = auth.uid()
        AND sellers.id::text = (storage.foldername(name))[2]
    )
  );

-- ========================================
-- 4. STORAGE POLICIES — vendor-images (public)
-- Path: vendor-images/vendors/{vendor_id}/...
-- ========================================

DROP POLICY IF EXISTS "vendor_images_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_seller_insert"  ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_seller_update"  ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_seller_delete"  ON storage.objects;
DROP POLICY IF EXISTS "vendor_images_admin_all"      ON storage.objects;

CREATE POLICY "vendor_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-images');

CREATE POLICY "vendor_images_seller_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'vendors'
    AND EXISTS (
      SELECT 1 FROM public.seller_vendor_roles svr
      JOIN public.sellers s ON s.id = svr.seller_id
      WHERE s.user_id = auth.uid()
        AND svr.vendor_id::text = (storage.foldername(name))[2]
        AND s.status = 'active'
    )
  );

CREATE POLICY "vendor_images_seller_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vendor-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'vendors'
    AND EXISTS (
      SELECT 1 FROM public.seller_vendor_roles svr
      JOIN public.sellers s ON s.id = svr.seller_id
      WHERE s.user_id = auth.uid()
        AND svr.vendor_id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "vendor_images_seller_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vendor-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'vendors'
    AND EXISTS (
      SELECT 1 FROM public.seller_vendor_roles svr
      JOIN public.sellers s ON s.id = svr.seller_id
      WHERE s.user_id = auth.uid()
        AND svr.vendor_id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "vendor_images_admin_all" ON storage.objects
  FOR ALL USING (
    bucket_id = 'vendor-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- 5. STORAGE POLICIES — menu-item-images (public)
-- Path: menu-item-images/vendors/{vendor_id}/items/{item_id}/...
-- ========================================

DROP POLICY IF EXISTS "menu_item_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "menu_item_images_seller_insert" ON storage.objects;
DROP POLICY IF EXISTS "menu_item_images_seller_update" ON storage.objects;
DROP POLICY IF EXISTS "menu_item_images_seller_delete" ON storage.objects;
DROP POLICY IF EXISTS "menu_item_images_admin_all"     ON storage.objects;

CREATE POLICY "menu_item_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-item-images');

CREATE POLICY "menu_item_images_seller_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-item-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'vendors'
    AND EXISTS (
      SELECT 1 FROM public.seller_vendor_roles svr
      JOIN public.sellers s ON s.id = svr.seller_id
      WHERE s.user_id = auth.uid()
        AND svr.vendor_id::text = (storage.foldername(name))[2]
        AND s.status = 'active'
    )
  );

CREATE POLICY "menu_item_images_seller_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'menu-item-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'vendors'
    AND EXISTS (
      SELECT 1 FROM public.seller_vendor_roles svr
      JOIN public.sellers s ON s.id = svr.seller_id
      WHERE s.user_id = auth.uid()
        AND svr.vendor_id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "menu_item_images_seller_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'menu-item-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'vendors'
    AND EXISTS (
      SELECT 1 FROM public.seller_vendor_roles svr
      JOIN public.sellers s ON s.id = svr.seller_id
      WHERE s.user_id = auth.uid()
        AND svr.vendor_id::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "menu_item_images_admin_all" ON storage.objects
  FOR ALL USING (
    bucket_id = 'menu-item-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- 6. STORAGE POLICIES — review-images (private)
-- Path: review-images/reviews/{review_id}/...
-- Chỉ hiển thị khi review_media.status = 'visible'
-- ========================================

DROP POLICY IF EXISTS "review_images_read_visible"  ON storage.objects;
DROP POLICY IF EXISTS "review_images_read_own"       ON storage.objects;
DROP POLICY IF EXISTS "review_images_auth_insert"    ON storage.objects;
DROP POLICY IF EXISTS "review_images_owner_delete"   ON storage.objects;
DROP POLICY IF EXISTS "review_images_admin_all"      ON storage.objects;

-- Read: chỉ ảnh đã được duyệt (status = 'visible') hoặc là chủ ảnh
CREATE POLICY "review_images_read_visible" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'review-images'
    AND (
      -- Chủ ảnh luôn đọc được
      owner = auth.uid()
      OR
      -- Ảnh đã được duyệt
      EXISTS (
        SELECT 1 FROM public.review_media rm
        WHERE rm.storage_path = name
          AND rm.status = 'visible'
      )
    )
  );

-- Upload: authenticated users vào folder của review mình tạo
CREATE POLICY "review_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'reviews'
  );

-- Xóa: chủ ảnh
CREATE POLICY "review_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-images'
    AND owner = auth.uid()
  );

-- Admin: full quyền
CREATE POLICY "review_images_admin_all" ON storage.objects
  FOR ALL USING (
    bucket_id = 'review-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
