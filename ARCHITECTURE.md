# QuickRider — System Architecture

Hyperlocal grocery delivery platform connecting neighbourhood shops with nearby customers.

## 1. High-level architecture

```
 ┌──────────────────────────┐        HTTPS (same-site)        ┌─────────────────────────────┐
 │  React SPA (Vite)        │  ───────────────────────────▶   │  Spring Boot 3 API (:8080)   │
 │  :5173 (dev, proxied)    │  Cookies: QR_ACCESS (HttpOnly)  │  /api/**                     │
 │  Axios withCredentials   │           XSRF-TOKEN (readable) │  Spring Security 6           │
 │  X-XSRF-TOKEN header     │  ◀───────────────────────────   │  JWT cookie filter + CSRF    │
 └──────────────────────────┘                                 └──────────────┬──────────────┘
                                                                             │ JPA / Hibernate
                                                                             ▼ (ddl-auto=validate)
                                                              ┌─────────────────────────────┐
                                                              │ PostgreSQL 15+  (Flyway)     │
                                                              └─────────────────────────────┘
```

* **Layering (backend):** `controller → service (interface + impl) → repository → entity`, with DTOs at the
  controller boundary and mappers between DTO/entity. Entities never leak to the API.
* **Auth:** Login issues a signed JWT (HS256) set as `QR_ACCESS` cookie — `HttpOnly; Secure; SameSite=Strict; Path=/`.
  A `JwtCookieAuthenticationFilter` reads the cookie on every request. No tokens in JS-accessible storage.
* **CSRF:** `CookieCsrfTokenRepository.withHttpOnlyFalse()` writes `XSRF-TOKEN`; Axios echoes it as `X-XSRF-TOKEN`.
  `SpaCsrfTokenRequestHandler` supports BREACH-safe masked tokens plus the raw cookie value. `/api/auth/csrf` primes the cookie.
* **RBAC:** `/api/admin/**` → `ROLE_ADMIN`, `/api/shopkeeper/**` → `ROLE_SHOPKEEPER`, `/api/customer/**` → `ROLE_CUSTOMER`,
  `/api/public/**` and `/api/auth/**` open. Shopkeeper endpoints additionally scope every query to the caller's own shop.
* **Dev proxy:** Vite proxies `/api` to `:8080`, so the browser sees one origin and `SameSite=Strict` cookies work.
  `Secure` cookies are accepted on `http://localhost` by modern browsers; toggle via `app.security.cookie-secure`.

## 2. Domain model

| Table          | Purpose                                                                 |
|----------------|-------------------------------------------------------------------------|
| `users`        | All accounts; `role` ∈ ADMIN / SHOPKEEPER / CUSTOMER; BCrypt password    |
| `addresses`    | Customer delivery addresses                                              |
| `shops`        | Grocery shop, pincode, radius, hours, `active`, 1:1 `owner_id` → shopkeeper |
| `categories`   | Fresh Produce, Dairy & Bakery, Staples & Grains, Beverages, …            |
| `products`     | Shop catalogue items: unit, price, discounted price, stock, `version` (optimistic lock) |
| `orders`       | One shop per order; status pipeline; amounts snapshotted                |
| `order_items`  | Line items with price snapshot                                           |
| `order_status_history` | Audit trail powering the customer tracker                        |

Order status pipeline: `PLACED → ACCEPTED → PACKING → OUT_FOR_DELIVERY → DELIVERED`, `CANCELLED` from PLACED/ACCEPTED/PACKING.

## 3. Folder structure

```
quickrider/
├── ARCHITECTURE.md
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/quickrider/
│       │   ├── QuickRiderApplication.java
│       │   ├── config/            # SecurityConfig, CorsConfig, JpaAuditingConfig, AppProperties
│       │   ├── security/
│       │   │   ├── jwt/           # JwtService, JwtCookieAuthenticationFilter, CookieUtil
│       │   │   ├── csrf/          # SpaCsrfTokenRequestHandler, CsrfCookieFilter
│       │   │   └── ...            # UserPrincipal, CustomUserDetailsService, entry point / denied handlers
│       │   ├── controller/
│       │   │   ├── auth/          # AuthController (/api/auth)
│       │   │   ├── admin/         # AdminShopController, AdminMetricsController
│       │   │   ├── shopkeeper/    # ShopkeeperProductController, ShopkeeperOrderController
│       │   │   └── customer/      # PublicShopController, CustomerOrderController, AddressController
│       │   ├── service/ + impl/   # AuthService, ShopService, ProductService, OrderService, MetricsService
│       │   ├── repository/        # Spring Data JPA repositories
│       │   ├── entity/ + enums/   # User, Shop, Category, Product, Order, OrderItem, ... Role, OrderStatus
│       │   ├── dto/request|response
│       │   ├── mapper/            # entity ⇄ DTO mappers
│       │   ├── exception/         # GlobalExceptionHandler, ApiError, domain exceptions
│       │   └── util/
│       └── resources/
│           ├── application.yml
│           └── db/migration/      # V1__init_schema.sql, V2__seed_data.sql
└── frontend/
    ├── index.html, package.json, vite.config.js, tailwind.config.js, postcss.config.js
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/                   # axiosClient.js (CSRF + credentials), authApi, adminApi, shopkeeperApi, customerApi
        ├── context/               # AuthContext, CartContext
        ├── routes/                # AppRouter, ProtectedRoute, RoleRedirect
        ├── components/
        │   ├── layout/            # AdminLayout, ShopkeeperLayout, CustomerLayout, Sidebar, TopBar, BottomNav
        │   └── common/            # Button, Input, Modal, Badge, StatusTracker, ProductCard, ShopCard, EmptyState
        ├── pages/
        │   ├── auth/              # Login, Register
        │   ├── admin/             # Dashboard, Shops, ShopForm
        │   ├── shopkeeper/        # Dashboard, Inventory, ProductForm, Orders
        │   └── customer/          # Home, ShopDetail, Cart, Checkout, Orders, OrderTracking
        ├── hooks/                 # useDebounce, useFetch
        └── utils/                 # formatCurrency, constants (status colours, categories)
```

## 4. Seed accounts (V2) — all passwords: `password`

| Role       | Email                         |
|------------|-------------------------------|
| Admin      | admin@quickrider.com          |
| Shopkeeper | ravi.fresh@quickrider.com (FreshMart Koregaon Park) |
| Shopkeeper | anita.daily@quickrider.com (Daily Needs Supermarket) |
| Shopkeeper | suresh.green@quickrider.com (Green Basket Organics, inactive) |
| Customer   | priya@example.com             |
| Customer   | rahul@example.com             |

Change these immediately outside local development.

## 5. Running (after Phase 2–4)

```
createdb quickrider            # or: CREATE DATABASE quickrider;
cd backend && mvn spring-boot:run
cd frontend && npm install && npm run dev
```
Env overrides: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (Base64, ≥ 256-bit), `COOKIE_SECURE`, `CORS_ORIGINS`.
