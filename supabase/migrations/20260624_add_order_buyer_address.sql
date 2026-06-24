ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_address TEXT;
COMMENT ON COLUMN orders.buyer_address IS 'Địa chỉ giao hàng (chỉ dùng khi fulfillment_method = seller_delivery)';
