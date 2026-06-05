-- ===========================================
-- HolaMate Database Schema
-- Project: holamate_exe201
-- ===========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUM TYPES
-- ===========================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'seller', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('normal_user', 'student_user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_type AS ENUM ('fixed_shop', 'student_booth');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'hidden', 'rejected', 'duplicate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_source AS ENUM ('google_maps', 'manual', 'seller_submitted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE item_type AS ENUM ('food', 'drink', 'combo', 'display_product');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE review_type AS ENUM ('vendor', 'menu_item');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('visible', 'hidden', 'pending', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('submitted', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_method AS ENUM ('pickup', 'seller_delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE media_status AS ENUM ('visible', 'hidden', 'pending', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_media_type AS ENUM ('cover', 'logo', 'menu', 'food', 'booth', 'signboard', 'space', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE seller_type AS ENUM ('fixed_shop_owner', 'student_seller', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE seller_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===========================================
-- TABLES
-- ===========================================

-- 1. profiles (synced với Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    user_type user_type NOT NULL DEFAULT 'normal_user',
    status user_status NOT NULL DEFAULT 'active',
    is_anonymous_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    contact_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. sellers
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    phone TEXT,
    zalo TEXT,
    seller_type seller_type NOT NULL,
    status seller_status NOT NULL DEFAULT 'pending',
    is_student_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. vendors (quán ăn + gian hàng sinh viên)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    vendor_type vendor_type NOT NULL,
    status vendor_status NOT NULL DEFAULT 'pending',
    source vendor_source NOT NULL DEFAULT 'manual',
    cover_image_url TEXT,
    logo_url TEXT,
    phone TEXT,
    zalo TEXT,
    address TEXT,
    area TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    opening_hours JSONB,
    has_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_note TEXT,
    price_range_min INTEGER,
    price_range_max INTEGER,
    food_categories TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. seller_vendor_roles (N-N: seller ↔ vendor)
CREATE TABLE IF NOT EXISTS seller_vendor_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(seller_id, vendor_id)
);

-- 5. menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    item_type item_type NOT NULL DEFAULT 'food',
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    stock_quantity INTEGER,
    selling_date DATE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    review_type review_type NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    status review_status NOT NULL DEFAULT 'visible',
    avg_vote_score DECIMAL(3,2) DEFAULT 0,
    vote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT review_target_check CHECK (
        (review_type = 'vendor' AND vendor_id IS NOT NULL AND menu_item_id IS NULL) OR
        (review_type = 'menu_item' AND menu_item_id IS NOT NULL AND vendor_id IS NOT NULL)
    )
);

-- 7. vendor_media
CREATE TABLE IF NOT EXISTS vendor_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    media_type vendor_media_type NOT NULL DEFAULT 'other',
    caption TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status media_status NOT NULL DEFAULT 'visible',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. menu_item_media
CREATE TABLE IF NOT EXISTS menu_item_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status media_status NOT NULL DEFAULT 'visible',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. review_media
CREATE TABLE IF NOT EXISTS review_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status media_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. review_votes
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- 11. review_reports
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'submitted',
    fulfillment_method fulfillment_method NOT NULL DEFAULT 'pickup',
    note TEXT,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    total_price INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    item_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. student_verifications
CREATE TABLE IF NOT EXISTS student_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. user_reports
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. saved_vendors
CREATE TABLE IF NOT EXISTS saved_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, vendor_id)
);

-- 17. ai_search_logs
CREATE TABLE IF NOT EXISTS ai_search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    parsed_filters JSONB,
    result_vendor_ids UUID[],
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_area ON vendors(area);
CREATE INDEX IF NOT EXISTS idx_vendors_has_delivery ON vendors(has_delivery);
CREATE INDEX IF NOT EXISTS idx_vendors_food_categories ON vendors USING GIN(food_categories);

CREATE INDEX IF NOT EXISTS idx_menu_items_vendor_id ON menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_selling_date ON menu_items(selling_date);
CREATE INDEX IF NOT EXISTS idx_menu_items_item_type ON menu_items(item_type);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);

CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_menu_item_id ON reviews(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(review_type);

CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_media_vendor_id ON vendor_media(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_media_status ON vendor_media(status);

CREATE INDEX IF NOT EXISTS idx_menu_item_media_item_id ON menu_item_media(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_review_media_review_id ON review_media(review_id);
CREATE INDEX IF NOT EXISTS idx_review_media_status ON review_media(status);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_saved_vendors_user_id ON saved_vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_logs_user_id ON ai_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_logs_created_at ON ai_search_logs(created_at DESC);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sellers_updated_at ON sellers;
CREATE TRIGGER trg_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_vendors_updated_at ON vendors;
CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_menu_items_updated_at ON menu_items;
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update review vote statistics
CREATE OR REPLACE FUNCTION update_review_vote_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_review_id UUID;
BEGIN
    v_review_id := COALESCE(NEW.review_id, OLD.review_id);
    UPDATE reviews
    SET
        avg_vote_score = (SELECT ROUND(AVG(score)::NUMERIC, 2) FROM review_votes WHERE review_id = v_review_id),
        vote_count = (SELECT COUNT(*) FROM review_votes WHERE review_id = v_review_id)
    WHERE id = v_review_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_votes_stats ON review_votes;
CREATE TRIGGER trg_review_votes_stats
AFTER INSERT OR UPDATE OR DELETE ON review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_vote_stats();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- HELPER FUNCTIONS FOR RLS
-- ===========================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_vendor_seller(p_vendor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM seller_vendor_roles svr
        JOIN sellers s ON s.id = svr.seller_id
        WHERE svr.vendor_id = p_vendor_id
          AND s.user_id = auth.uid()
          AND s.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_vendor_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- sellers
DROP POLICY IF EXISTS "sellers_select_active" ON sellers;
CREATE POLICY "sellers_select_active" ON sellers FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "sellers_manage_own" ON sellers;
CREATE POLICY "sellers_manage_own" ON sellers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sellers_admin_all" ON sellers;
CREATE POLICY "sellers_admin_all" ON sellers FOR ALL USING (is_admin());

-- vendors
DROP POLICY IF EXISTS "vendors_select_active" ON vendors;
CREATE POLICY "vendors_select_active" ON vendors FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "vendors_update_seller" ON vendors;
CREATE POLICY "vendors_update_seller" ON vendors FOR UPDATE USING (is_vendor_seller(id));

DROP POLICY IF EXISTS "vendors_admin_all" ON vendors;
CREATE POLICY "vendors_admin_all" ON vendors FOR ALL USING (is_admin());

-- seller_vendor_roles
DROP POLICY IF EXISTS "svr_select" ON seller_vendor_roles;
CREATE POLICY "svr_select" ON seller_vendor_roles FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM sellers WHERE sellers.id = seller_id AND sellers.user_id = auth.uid())
        OR is_admin()
    );

DROP POLICY IF EXISTS "svr_admin_all" ON seller_vendor_roles;
CREATE POLICY "svr_admin_all" ON seller_vendor_roles FOR ALL USING (is_admin());

-- menu_items
DROP POLICY IF EXISTS "menu_items_select_active" ON menu_items;
CREATE POLICY "menu_items_select_active" ON menu_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_id AND vendors.status = 'active'));

DROP POLICY IF EXISTS "menu_items_seller_all" ON menu_items;
CREATE POLICY "menu_items_seller_all" ON menu_items FOR ALL USING (is_vendor_seller(vendor_id));

DROP POLICY IF EXISTS "menu_items_admin_all" ON menu_items;
CREATE POLICY "menu_items_admin_all" ON menu_items FOR ALL USING (is_admin());

-- reviews
DROP POLICY IF EXISTS "reviews_select_visible" ON reviews;
CREATE POLICY "reviews_select_visible" ON reviews FOR SELECT USING (status = 'visible');

DROP POLICY IF EXISTS "reviews_insert_auth" ON reviews;
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
CREATE POLICY "reviews_admin_all" ON reviews FOR ALL USING (is_admin());

-- review_votes
DROP POLICY IF EXISTS "review_votes_select_all" ON review_votes;
CREATE POLICY "review_votes_select_all" ON review_votes FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "review_votes_insert" ON review_votes;
CREATE POLICY "review_votes_insert" ON review_votes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND NOT EXISTS (
            SELECT 1 FROM reviews WHERE reviews.id = review_id AND reviews.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "review_votes_update_own" ON review_votes;
CREATE POLICY "review_votes_update_own" ON review_votes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_votes_delete_own" ON review_votes;
CREATE POLICY "review_votes_delete_own" ON review_votes FOR DELETE USING (auth.uid() = user_id);

-- review_reports
DROP POLICY IF EXISTS "review_reports_insert_auth" ON review_reports;
CREATE POLICY "review_reports_insert_auth" ON review_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "review_reports_admin_all" ON review_reports;
CREATE POLICY "review_reports_admin_all" ON review_reports FOR ALL USING (is_admin());

-- review_media
DROP POLICY IF EXISTS "review_media_select_visible" ON review_media;
CREATE POLICY "review_media_select_visible" ON review_media FOR SELECT USING (status = 'visible');

DROP POLICY IF EXISTS "review_media_insert_auth" ON review_media;
CREATE POLICY "review_media_insert_auth" ON review_media FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "review_media_admin_all" ON review_media;
CREATE POLICY "review_media_admin_all" ON review_media FOR ALL USING (is_admin());

-- vendor_media
DROP POLICY IF EXISTS "vendor_media_select_visible" ON vendor_media;
CREATE POLICY "vendor_media_select_visible" ON vendor_media FOR SELECT USING (status = 'visible');

DROP POLICY IF EXISTS "vendor_media_seller_all" ON vendor_media;
CREATE POLICY "vendor_media_seller_all" ON vendor_media FOR ALL USING (is_vendor_seller(vendor_id));

DROP POLICY IF EXISTS "vendor_media_admin_all" ON vendor_media;
CREATE POLICY "vendor_media_admin_all" ON vendor_media FOR ALL USING (is_admin());

-- menu_item_media
DROP POLICY IF EXISTS "menu_item_media_select_visible" ON menu_item_media;
CREATE POLICY "menu_item_media_select_visible" ON menu_item_media FOR SELECT USING (status = 'visible');

DROP POLICY IF EXISTS "menu_item_media_seller_all" ON menu_item_media;
CREATE POLICY "menu_item_media_seller_all" ON menu_item_media FOR ALL
    USING (EXISTS (
        SELECT 1 FROM menu_items WHERE menu_items.id = menu_item_id AND is_vendor_seller(menu_items.vendor_id)
    ));

DROP POLICY IF EXISTS "menu_item_media_admin_all" ON menu_item_media;
CREATE POLICY "menu_item_media_admin_all" ON menu_item_media FOR ALL USING (is_admin());

-- orders
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_select_seller" ON orders;
CREATE POLICY "orders_select_seller" ON orders FOR SELECT USING (is_vendor_seller(vendor_id));

DROP POLICY IF EXISTS "orders_insert_auth" ON orders;
CREATE POLICY "orders_insert_auth" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_seller" ON orders;
CREATE POLICY "orders_update_seller" ON orders FOR UPDATE USING (is_vendor_seller(vendor_id));

DROP POLICY IF EXISTS "orders_admin_all" ON orders;
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (is_admin());

-- order_items
DROP POLICY IF EXISTS "order_items_select_user" ON order_items;
CREATE POLICY "order_items_select_user" ON order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_select_seller" ON order_items;
CREATE POLICY "order_items_select_seller" ON order_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND is_vendor_seller(orders.vendor_id)));

DROP POLICY IF EXISTS "order_items_insert_auth" ON order_items;
CREATE POLICY "order_items_insert_auth" ON order_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL USING (is_admin());

-- student_verifications
DROP POLICY IF EXISTS "student_verif_select_own" ON student_verifications;
CREATE POLICY "student_verif_select_own" ON student_verifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "student_verif_insert_own" ON student_verifications;
CREATE POLICY "student_verif_insert_own" ON student_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "student_verif_admin_all" ON student_verifications;
CREATE POLICY "student_verif_admin_all" ON student_verifications FOR ALL USING (is_admin());

-- user_reports
DROP POLICY IF EXISTS "user_reports_insert_auth" ON user_reports;
CREATE POLICY "user_reports_insert_auth" ON user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "user_reports_select_own" ON user_reports;
CREATE POLICY "user_reports_select_own" ON user_reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "user_reports_admin_all" ON user_reports;
CREATE POLICY "user_reports_admin_all" ON user_reports FOR ALL USING (is_admin());

-- saved_vendors
DROP POLICY IF EXISTS "saved_vendors_own" ON saved_vendors;
CREATE POLICY "saved_vendors_own" ON saved_vendors FOR ALL USING (auth.uid() = user_id);

-- ai_search_logs
DROP POLICY IF EXISTS "ai_logs_insert_all" ON ai_search_logs;
CREATE POLICY "ai_logs_insert_all" ON ai_search_logs FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "ai_logs_select_own" ON ai_search_logs;
CREATE POLICY "ai_logs_select_own" ON ai_search_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_logs_admin_all" ON ai_search_logs;
CREATE POLICY "ai_logs_admin_all" ON ai_search_logs FOR ALL USING (is_admin());

-- admin_logs
DROP POLICY IF EXISTS "admin_logs_admin_all" ON admin_logs;
CREATE POLICY "admin_logs_admin_all" ON admin_logs FOR ALL USING (is_admin());
