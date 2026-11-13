# Elegance Jewellery

The storefront keeps its existing HTML/CSS/JavaScript design and uses a same-origin PHP API for Supabase Auth and all database changes. No service-role key is used; authenticated requests keep Supabase Row Level Security in force.

## Structure

```
Elegance_Jewellery_Proper_Structure/
├── index.html
├── assets/
│   └── images/
│       ├── hero-main.jpg
│       ├── about-jewellery.jpg
│       ├── upi-payment.jpg
│       └── products/
│           ├── product-01.jpg ... product-17.jpg
├── css/
│   ├── base.css
│   ├── about.css
│   ├── auth.css
│   ├── collection.css
│   ├── custom-design.css
│   ├── store.css
│   └── admin.css
├── js/
│   ├── data.js
│   ├── main.js
│   └── admin.js
├── backend/
│   ├── api/
│   │   ├── _bootstrap.php
│   │   ├── auth.php
│   │   ├── products.php
│   │   ├── orders.php
│   │   ├── custom-design.php
│   │   ├── contact.php
│   │   ├── admin.php
│   │   ├── admin-auth.php
│   │   └── health.php
│   ├── config/config.php
│   ├── lib/SupabaseClient.php
│   └── router.php
├── database/
│   ├── supabase_schema.sql
│   └── README.md
└── .env.example
```

## Local setup

1. Copy `.env.example` to `.env`. The provided project URL and publishable key are already filled in. Do not add a service-role key; it is not required by this app.
2. Run `database/supabase_schema.sql` in the configured Supabase project's SQL Editor. Re-run it when updating an existing database; the script adds the current policies and RPCs for product management, checkout, cancellation, custom-design submissions, and contact questions. The 17 seeded designs have curated prices from ₹2,000 to ₹20,000, with the same prices in the storefront and database migration. Admin and database validation enforce that range for future prices; run the migration to update saved catalogue prices. It removes any existing `NOT NULL` constraint from stock and, because no starting quantities were provided, treats zero stock on the 17 seeded products as untracked stock (`NULL`) so it does not incorrectly mark every item unavailable. The storefront also treats those seeded zeros as untracked until the migration is applied. Set actual quantities in Admin to enforce stock limits.
3. Use PHP 8.1+ with the cURL extension enabled, and start the whole site from the project root:

   ```sh
   php -S 127.0.0.1:8000 -t . backend/router.php
   ```

4. Open `http://127.0.0.1:8000`. The PHP router blocks direct requests to `.env`. Apache deployments should keep the included `.htaccess` enabled and configure the site origin in `.env`.
5. Check `http://127.0.0.1:8000/backend/api/health.php`. A healthy response verifies connectivity and the current database RPC schema; it will tell you to run the SQL if the new functions are missing.

Set `APP_ORIGIN` to the exact deployed site origin (scheme and host, including a non-default port). The API is same-origin and does not enable wildcard CORS.

## Supabase-backed features

- The product catalogue loads from `products`; admin create, edit, stock, and delete actions are persisted.
- Signup, login, refresh, session restore, and logout use Supabase Auth through PHP. Phone SMS confirmation remains available if Phone Auth is enabled. The profile trigger stores customer accounts in `profiles`.
- Checkout creates an order and its line items atomically from database prices. Customers see their own order history and can cancel orders in `Placed` or `Pending` status.
- The administrator signs in with a separate username/password. PHP keeps a secure session cookie, and narrow Supabase database RPCs verify that session before exposing or changing admin data; no service-role key or customer Supabase login is used for admin access.
- Admin orders refresh from Supabase; status, payment status, carrier, and tracking changes are saved in the database.
- Custom design requests and contact questions are saved in Supabase. Customer questions still open WhatsApp after being saved.

To allow email signup without email verification, disable **Confirm email** in the Supabase Dashboard under **Authentication → Sign In / Providers → Email**. Signup only completes when Supabase returns an active session; if it does not, the website explains which setting is still enabled. Phone sign-in still requires Phone Auth and an SMS provider (it is disabled for this project).

Disabling email confirmation removes the signup confirmation email and its email-send rate limit from the signup flow. Email verification and resend endpoints are not available in the website; phone SMS confirmation remains supported if Phone Auth is enabled.

Running `database/supabase_schema.sql` creates the administrator login infrastructure but does not create an administrator account. After the schema succeeds, run this upsert in the Supabase SQL Editor to create or reset the administrator account. Replace the placeholder with the administrator password only in SQL Editor; do not commit a real password to project files. A successful health check verifies the schema, not that this account has been provisioned:

```sql
insert into public.admin_credentials (username, password_hash)
values (
  'Kaur_preet',
  extensions.crypt('REPLACE_WITH_ADMIN_PASSWORD', extensions.gen_salt('bf'))
)
on conflict (username) do update
set password_hash = excluded.password_hash, enabled = true;
```

Do not expose a service-role key. Admin RPCs are granted to the public API role but require the private, expiring admin session token; the credential and session tables are not readable through the API. Customer requests continue to use Supabase Auth and row-level security.
