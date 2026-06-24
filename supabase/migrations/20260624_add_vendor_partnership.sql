-- Add is_partnered column to vendors
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS is_partnered BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN vendors.is_partnered IS
'true = quán liên kết (hợp tác với HolaMate, cho phép đặt món trực tuyến),
 false = quán không liên kết (chỉ hiển thị để cộng đồng review)';

-- Auto-mark vendors that already have a seller as partnered
UPDATE vendors
SET is_partnered = true
WHERE id IN (
  SELECT DISTINCT vendor_id
  FROM seller_vendor_roles
);
