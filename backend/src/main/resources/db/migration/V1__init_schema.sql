-- =====================================================================
-- QuickRider - V1 initial schema
-- =====================================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(160)  NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(100)  NOT NULL,
    role            VARCHAR(20)   NOT NULL,
    enabled         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'SHOPKEEPER', 'CUSTOMER'))
);
CREATE INDEX idx_users_role ON users (role);

CREATE TABLE addresses (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    label           VARCHAR(40)   NOT NULL DEFAULT 'Home',
    line1           VARCHAR(200)  NOT NULL,
    line2           VARCHAR(200),
    city            VARCHAR(80)   NOT NULL,
    pincode         VARCHAR(10)   NOT NULL,
    is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_addresses_pincode CHECK (pincode ~ '^[0-9]{6}$')
);
CREATE INDEX idx_addresses_user ON addresses (user_id);

CREATE TABLE shops (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(150)  NOT NULL,
    description         VARCHAR(500),
    address             VARCHAR(300)  NOT NULL,
    city                VARCHAR(80)   NOT NULL,
    pincode             VARCHAR(10)   NOT NULL,
    phone               VARCHAR(20),
    delivery_radius_km  NUMERIC(5,2)  NOT NULL DEFAULT 3.00,
    opening_time        TIME          NOT NULL DEFAULT '08:00',
    closing_time        TIME          NOT NULL DEFAULT '22:00',
    image_url           VARCHAR(500),
    min_order_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
    rating              NUMERIC(2,1)  NOT NULL DEFAULT 0.0,
    active              BOOLEAN       NOT NULL DEFAULT TRUE,
    owner_id            BIGINT        NOT NULL REFERENCES users (id),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_shops_owner UNIQUE (owner_id),
    CONSTRAINT ck_shops_pincode CHECK (pincode ~ '^[0-9]{6}$'),
    CONSTRAINT ck_shops_radius CHECK (delivery_radius_km > 0 AND delivery_radius_km <= 50),
    CONSTRAINT ck_shops_rating CHECK (rating >= 0 AND rating <= 5)
);
CREATE INDEX idx_shops_pincode_active ON shops (pincode, active);
CREATE INDEX idx_shops_name_lower ON shops (LOWER(name));

CREATE TABLE categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(80)   NOT NULL,
    slug            VARCHAR(80)   NOT NULL,
    icon            VARCHAR(40),
    sort_order      INT           NOT NULL DEFAULT 0,
    CONSTRAINT uk_categories_name UNIQUE (name),
    CONSTRAINT uk_categories_slug UNIQUE (slug)
);

CREATE TABLE products (
    id                  BIGSERIAL PRIMARY KEY,
    shop_id             BIGINT        NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    category_id         BIGINT        NOT NULL REFERENCES categories (id),
    name                VARCHAR(150)  NOT NULL,
    description         VARCHAR(500),
    unit                VARCHAR(30)   NOT NULL,
    price               NUMERIC(10,2) NOT NULL,
    discounted_price    NUMERIC(10,2),
    stock_quantity      INT           NOT NULL DEFAULT 0,
    image_url           VARCHAR(500),
    available           BOOLEAN       NOT NULL DEFAULT TRUE,
    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_products_price CHECK (price > 0),
    CONSTRAINT ck_products_discount CHECK (discounted_price IS NULL OR (discounted_price > 0 AND discounted_price <= price)),
    CONSTRAINT ck_products_stock CHECK (stock_quantity >= 0),
    CONSTRAINT uk_products_shop_name_unit UNIQUE (shop_id, name, unit)
);
CREATE INDEX idx_products_shop ON products (shop_id);
CREATE INDEX idx_products_shop_category ON products (shop_id, category_id);
CREATE INDEX idx_products_name_lower ON products (LOWER(name));

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(30)   NOT NULL,
    customer_id         BIGINT        NOT NULL REFERENCES users (id),
    shop_id             BIGINT        NOT NULL REFERENCES shops (id),
    status              VARCHAR(30)   NOT NULL DEFAULT 'PLACED',
    delivery_name       VARCHAR(120)  NOT NULL,
    delivery_phone      VARCHAR(20)   NOT NULL,
    delivery_address    VARCHAR(400)  NOT NULL,
    delivery_pincode    VARCHAR(10)   NOT NULL,
    subtotal            NUMERIC(10,2) NOT NULL,
    delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(10,2) NOT NULL,
    payment_method      VARCHAR(20)   NOT NULL DEFAULT 'COD',
    notes               VARCHAR(300),
    cancel_reason       VARCHAR(300),
    version             BIGINT        NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_orders_number UNIQUE (order_number),
    CONSTRAINT ck_orders_status CHECK (status IN ('PLACED','ACCEPTED','PACKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
    CONSTRAINT ck_orders_payment CHECK (payment_method IN ('COD','UPI','CARD')),
    CONSTRAINT ck_orders_amounts CHECK (subtotal >= 0 AND delivery_fee >= 0 AND total_amount >= 0)
);
CREATE INDEX idx_orders_customer ON orders (customer_id, created_at DESC);
CREATE INDEX idx_orders_shop_status ON orders (shop_id, status, created_at DESC);

CREATE TABLE order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id      BIGINT        REFERENCES products (id) ON DELETE SET NULL,
    product_name    VARCHAR(150)  NOT NULL,
    unit            VARCHAR(30)   NOT NULL,
    unit_price      NUMERIC(10,2) NOT NULL,
    quantity        INT           NOT NULL,
    line_total      NUMERIC(10,2) NOT NULL,
    CONSTRAINT ck_order_items_qty CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE TABLE order_status_history (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    status          VARCHAR(30)   NOT NULL,
    changed_by      BIGINT        REFERENCES users (id),
    note            VARCHAR(300),
    changed_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_status_history_order ON order_status_history (order_id, changed_at);
