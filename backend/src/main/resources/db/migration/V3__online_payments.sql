-- Online payments (Razorpay) for UPI/CARD orders.
-- UPI/CARD orders now start in AWAITING_PAYMENT (hidden from the shop, stock reserved) and move to
-- PLACED once Razorpay confirms the payment. COD orders are unchanged and start in PLACED.

ALTER TABLE orders DROP CONSTRAINT ck_orders_status;
ALTER TABLE orders ADD CONSTRAINT ck_orders_status
    CHECK (status IN ('AWAITING_PAYMENT','PLACED','ACCEPTED','PACKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'));

ALTER TABLE orders
    ADD COLUMN payment_status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ADD COLUMN razorpay_order_id       VARCHAR(40),
    ADD COLUMN razorpay_payment_id     VARCHAR(40),
    ADD COLUMN payment_failure_reason  VARCHAR(255),
    ADD COLUMN paid_at                 TIMESTAMPTZ;

ALTER TABLE orders ADD CONSTRAINT ck_orders_payment_status
    CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUND_PENDING'));

CREATE UNIQUE INDEX uk_orders_razorpay_order ON orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX idx_orders_awaiting_payment ON orders (created_at) WHERE status = 'AWAITING_PAYMENT';

-- Existing orders pre-date online payments: delivered ones were settled on delivery.
UPDATE orders SET payment_status = 'PAID', paid_at = updated_at WHERE status = 'DELIVERED';
