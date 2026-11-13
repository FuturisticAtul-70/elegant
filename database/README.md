# Supabase setup

1. Open the SQL Editor for the configured Supabase project and run `supabase_schema.sql` after each schema update. The API health check verifies a database RPC added by the current script. The migration sets each of the 17 seeded jewellery designs to its curated price between ₹2,000 and ₹20,000, brings other existing prices into that range, and adds a database constraint enforcing the range. The storefront temporarily recognizes legacy seed prices until this migration is applied. The schema also removes the old `NOT NULL` constraint from `products.stock` and treats zero stock on the 17 seeded catalogue products as untracked stock (`NULL`) because no real inventory quantities were provided. Set actual stock in Admin to enforce inventory limits.
2. The script enables row-level security, public catalogue reads, authenticated order creation and customer cancellation, admin-only product/order/custom-request management, and public form-submission RPCs. Orders are priced from database catalogue rows and saved with their line items atomically.
3. Copy the project-root `.env.example` to `.env`. PHP loads the Supabase URL and publishable key server-side; the website makes same-origin requests to `backend/api/`. No service-role key is used or needed.
4. To let customers sign up without email verification, disable **Confirm email** in the Supabase Dashboard under **Authentication > Sign In / Providers > Email**. The website only treats signup as complete when Supabase returns an active session. Phone signup still requires Phone Auth and an enabled SMS provider (Phone Auth is currently disabled for this project).
5. Serve the project through PHP with cURL enabled. For local testing, use `php -S 127.0.0.1:8000 -t . backend/router.php`; do not open `index.html` directly or use a static-only server.

Running `supabase_schema.sql` creates the administrator login infrastructure but does not create an administrator account. After the schema succeeds, run this upsert in the Supabase SQL Editor to create or reset the administrator account. Replace the placeholder with the administrator password only in SQL Editor; do not commit a real password to project files. A successful health check verifies the schema, not that this account has been provisioned.

```sql
insert into public.admin_credentials (username, password_hash)
values (
  'Kaur_preet',
  extensions.crypt('REPLACE_WITH_ADMIN_PASSWORD', extensions.gen_salt('bf'))
)
on conflict (username) do update
set password_hash = excluded.password_hash, enabled = true;
```

You can confirm the account exists and is enabled without exposing its password hash:

```sql
select username, enabled
from public.admin_credentials
where username = 'Kaur_preet';
```

No service-role key is needed. The administrator uses a separate PHP session and database RPCs; customer sign-in, profiles, orders, and cancellations continue to use Supabase Auth and RLS.
