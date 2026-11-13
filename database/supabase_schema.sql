-- Elegance Jewellery database schema and public storefront access.
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists products (
  id bigint primary key,
  name text not null,
  category text,
  material text,
  description text,
  price numeric(12,2) not null default 0,
  image_url text,
  stock integer default null,
  attributes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer_id uuid references customers(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  pincode text not null,
  payment_method text not null,
  payment_reference text,
  total numeric(12,2) not null default 0,
  status text not null default 'Placed',
  payment_status text not null default 'Waiting payment',
  tracking_number text,
  carrier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table orders
  add column if not exists payment_status text not null default 'Waiting payment',
  add column if not exists tracking_number text,
  add column if not exists carrier text;

alter table profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  material text,
  unit_price numeric(12,2) not null default 0,
  quantity integer not null default 1
);

create table if not exists custom_design_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  jewellery_type text not null,
  material text not null,
  occasion text not null,
  preferred_style text not null,
  budget text,
  needed_by date,
  reference_url text,
  message text not null,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text not null,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_auth_user_id on orders(auth_user_id, created_at desc);
create index if not exists idx_custom_requests_created_at on custom_design_requests(created_at desc);
create index if not exists idx_contact_requests_created_at on contact_requests(created_at desc);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    new.phone
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, name, email, phone)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  email,
  phone
from auth.users
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  updated_at = now();

insert into products (id, name, category, material, price, image_url)
values
  (1, 'Moonlit Cluster Diamond Ring', 'Rings', 'Diamond', 12499, 'assets/images/products/product-01.jpg'),
  (2, 'Eternal Duo Ring Set', 'Rings', 'Platinum', 18999, 'assets/images/products/product-02.jpg'),
  (3, 'Blossom Ruby Noir Ring', 'Rings', 'Silver', 6999, 'assets/images/products/product-03.jpg'),
  (4, 'Royal Filigree Gem Ring', 'Rings', 'Gold', 9499, 'assets/images/products/product-04.jpg'),
  (5, 'Ruby Drop Cluster Earrings', 'Earrings', 'Diamond', 14999, 'assets/images/products/product-05.jpg'),
  (6, 'Antique Gold Teardrop Earrings', 'Earrings', 'Gold', 8999, 'assets/images/products/product-06.jpg'),
  (7, 'Emerald Wing Earrings', 'Earrings', 'Platinum', 17999, 'assets/images/products/product-07.jpg'),
  (8, 'Royal Sapphire Statement Necklace', 'Necklaces', 'Platinum', 19999, 'assets/images/products/product-08.jpg'),
  (9, 'Golden Heart Cascade Necklace Set', 'Necklaces', 'Gold', 15999, 'assets/images/products/product-09.jpg'),
  (10, 'Midnight Crystal Lace Necklace', 'Necklaces', 'Diamond', 18499, 'assets/images/products/product-10.jpg'),
  (11, 'Twisted Gold Rope Bracelet', 'Bracelets', 'Gold', 7999, 'assets/images/products/product-11.jpg'),
  (12, 'Crystal Star Charm Bracelet', 'Bracelets', 'Silver', 3499, 'assets/images/products/product-12.jpg'),
  (13, 'Black Onyx Vine Bracelet', 'Bracelets', 'Silver', 5999, 'assets/images/products/product-13.jpg'),
  (14, 'Noir Kundan Choker Set', 'Bridal Jewellery', 'Gold', 13999, 'assets/images/products/product-14.jpg'),
  (15, 'Maharani Kundan Bridal Set', 'Bridal Jewellery', 'Gold', 19499, 'assets/images/products/product-15.jpg'),
  (16, 'Pearl Polki Bridal Set', 'Bridal Jewellery', 'Diamond', 18999, 'assets/images/products/product-16.jpg'),
  (17, 'Ruby Shadow Choker Set', 'Bridal Jewellery', 'Gold', 12999, 'assets/images/products/product-17.jpg')
on conflict (id) do nothing;

create table if not exists public.app_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
revoke all on table public.app_migrations from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from public.app_migrations
    where version = 'product-price-cap-20000-v1'
  ) then
    update public.products
    set price = 20000
    where price > 20000;
    insert into public.app_migrations (version)
    values ('product-price-cap-20000-v1');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from public.app_migrations
    where version = 'product-prices-curated-2000-20000-v1'
  ) then
    update public.products as product
    set price = curated.price
    from (values
      (1::bigint, 12499::numeric),
      (2::bigint, 18999::numeric),
      (3::bigint, 6999::numeric),
      (4::bigint, 9499::numeric),
      (5::bigint, 14999::numeric),
      (6::bigint, 8999::numeric),
      (7::bigint, 17999::numeric),
      (8::bigint, 19999::numeric),
      (9::bigint, 15999::numeric),
      (10::bigint, 18499::numeric),
      (11::bigint, 7999::numeric),
      (12::bigint, 3499::numeric),
      (13::bigint, 5999::numeric),
      (14::bigint, 13999::numeric),
      (15::bigint, 19499::numeric),
      (16::bigint, 18999::numeric),
      (17::bigint, 12999::numeric)
    ) as curated(id, price)
    where product.id = curated.id;

    update public.products
    set price = greatest(2000, least(20000, price))
    where price < 2000 or price > 20000;

    insert into public.app_migrations (version)
    values ('product-prices-curated-2000-20000-v1');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_price_range_2000_20000'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_price_range_2000_20000 check (price between 2000 and 20000);
  end if;
end;
$$;

create table if not exists public.admin_credentials (
  username text primary key,
  password_hash text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_login_attempts (
  attempt_key text primary key,
  attempt_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz
);
revoke all on table public.admin_credentials, public.admin_sessions, public.admin_login_attempts
  from public, anon, authenticated;

alter table public.products alter column stock drop default;
alter table public.products alter column stock drop not null;

do $$
begin
  if not exists (
    select 1 from public.app_migrations
    where version = 'seed-catalogue-untracked-stock-v1'
  ) then
    update public.products
    set stock = null
    where id between 1 and 17 and stock = 0;
    insert into public.app_migrations (version)
    values ('seed-catalogue-untracked-stock-v1');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from public.app_migrations
    where version = 'seed-catalogue-untracked-stock-v2'
  ) then
    update public.products
    set stock = null
    where id between 1 and 17 and stock = 0;
    insert into public.app_migrations (version)
    values ('seed-catalogue-untracked-stock-v2');
  end if;
end;
$$;

alter table products enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table custom_design_requests enable row level security;
alter table contact_requests enable row level security;

revoke all on table products, profiles, customers, orders, order_items, custom_design_requests, contact_requests from public, anon, authenticated;
grant select on table products to anon, authenticated;
grant select on table profiles, orders, order_items to authenticated;
grant select on table custom_design_requests, contact_requests to authenticated;
grant insert, update, delete on table products to authenticated;
grant update (status, updated_at) on table custom_design_requests to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Anyone can read the product catalogue" on products;
create policy "Anyone can read the product catalogue"
  on products for select to anon, authenticated using (true);
drop policy if exists "Admins can manage the product catalogue" on products;
create policy "Admins can manage the product catalogue"
  on products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users can read their own profile" on profiles;
create policy "Users can read their own profile"
  on profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users can read their own orders" on orders;
create policy "Users can read their own orders"
  on orders for select to authenticated
  using (
    auth_user_id = (select auth.uid())
    or exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin
    )
  );

drop policy if exists "Users can read items from their own orders" on order_items;
create policy "Users can read items from their own orders"
  on order_items for select to authenticated
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and (
          orders.auth_user_id = (select auth.uid())
          or exists (
            select 1 from profiles
            where profiles.id = (select auth.uid()) and profiles.is_admin
          )
        )
    )
  );

drop policy if exists "Admins can read custom design requests" on custom_design_requests;
create policy "Admins can read custom design requests"
  on custom_design_requests for select to authenticated using (public.is_admin());
drop policy if exists "Admins can update custom design requests" on custom_design_requests;
create policy "Admins can update custom design requests"
  on custom_design_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can read contact requests" on contact_requests;
create policy "Admins can read contact requests"
  on contact_requests for select to authenticated using (public.is_admin());

create or replace function public.apply_order_inventory(p_order_id uuid, p_restore boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tracked_products integer;
  v_updated_products integer;
begin
  if p_restore then
    update products
    set stock = products.stock + requested.quantity
    from (
      select product_id, sum(quantity) as quantity
      from order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
    ) as requested
    where products.id = requested.product_id and products.stock is not null;
    return;
  end if;

  select count(*) into v_tracked_products
  from products
  join (
    select product_id, sum(quantity) as quantity
    from order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) as requested on requested.product_id = products.id
  where products.stock is not null;

  update products
  set stock = products.stock - requested.quantity
  from (
    select product_id, sum(quantity) as quantity
    from order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) as requested
  where products.id = requested.product_id
    and products.stock is not null
    and products.stock >= requested.quantity;
  get diagnostics v_updated_products = row_count;

  if v_updated_products <> v_tracked_products then
    raise exception 'One or more products no longer have enough stock. Please refresh your cart.';
  end if;
end;
$$;
revoke all on function public.apply_order_inventory(uuid, boolean) from public, anon, authenticated;

create or replace function public.require_admin_session(p_admin_token text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_admin_token is null or not exists (
    select 1
    from public.admin_sessions
    where token_hash = encode(extensions.digest(p_admin_token, 'sha256'), 'hex')
      and expires_at > now()
  ) then
    raise exception 'Administrator session expired. Please sign in again.';
  end if;
end;
$$;
revoke all on function public.require_admin_session(text) from public, anon, authenticated;

create or replace function public.admin_sign_in(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client text;
  v_attempt_key text;
  v_attempt_count integer;
  v_window_started_at timestamptz;
  v_blocked_until timestamptz;
  v_password_hash text;
  v_token text;
  v_expires_at timestamptz := now() + interval '8 hours';
begin
  v_client := coalesce(
    current_setting('request.headers', true)::jsonb ->> 'cf-connecting-ip',
    current_setting('request.headers', true)::jsonb ->> 'x-real-ip',
    split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1),
    'unknown'
  );
  v_attempt_key := encode(
    extensions.digest(lower(trim(coalesce(p_username, ''))) || ':' || trim(v_client), 'sha256'),
    'hex'
  );

  insert into public.admin_login_attempts (attempt_key)
  values (v_attempt_key)
  on conflict (attempt_key) do nothing;

  select attempt_count, window_started_at, blocked_until
  into v_attempt_count, v_window_started_at, v_blocked_until
  from public.admin_login_attempts
  where attempt_key = v_attempt_key
  for update;

  if v_blocked_until > now() then
    return jsonb_build_object('error', 'Invalid administrator username or password.');
  end if;
  if v_window_started_at < now() - interval '15 minutes' then
    v_attempt_count := 0;
  end if;
  if v_attempt_count >= 8 then
    update public.admin_login_attempts
    set blocked_until = now() + interval '15 minutes'
    where attempt_key = v_attempt_key;
    return jsonb_build_object('error', 'Invalid administrator username or password.');
  end if;

  update public.admin_login_attempts
  set attempt_count = v_attempt_count + 1,
      window_started_at = case
        when v_window_started_at < now() - interval '15 minutes' then now()
        else v_window_started_at
      end
  where attempt_key = v_attempt_key;

  select password_hash into v_password_hash
  from public.admin_credentials
  where username = trim(coalesce(p_username, '')) and enabled;

  if v_password_hash is null
     or extensions.crypt(coalesce(p_password, ''), v_password_hash) <> v_password_hash then
    return jsonb_build_object('error', 'Invalid administrator username or password.');
  end if;

  delete from public.admin_login_attempts where attempt_key = v_attempt_key;
  v_token := gen_random_uuid()::text;
  insert into public.admin_sessions (token_hash, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_expires_at);

  return jsonb_build_object('token', v_token, 'expires_at', v_expires_at);
end;
$$;
revoke all on function public.admin_sign_in(text, text) from public, authenticated;
grant execute on function public.admin_sign_in(text, text) to anon;

create or replace function public.admin_validate_session(p_admin_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_admin_session(p_admin_token);
  return jsonb_build_object('authenticated', true);
exception when others then
  return jsonb_build_object('authenticated', false);
end;
$$;
revoke all on function public.admin_validate_session(text) from public, authenticated;
grant execute on function public.admin_validate_session(text) to anon;

create or replace function public.admin_sign_out(p_admin_token text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.admin_sessions
  where token_hash = encode(extensions.digest(coalesce(p_admin_token, ''), 'sha256'), 'hex');
  return true;
end;
$$;
revoke all on function public.admin_sign_out(text) from public, authenticated;
grant execute on function public.admin_sign_out(text) to anon;

create or replace function public.admin_list_orders(p_admin_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_admin_session(p_admin_token);
  return (
    select coalesce(jsonb_agg(order_row.data order by order_row.created_at desc), '[]'::jsonb)
    from (
      select orders.created_at,
        to_jsonb(orders) || jsonb_build_object(
          'order_items',
          coalesce((
            select jsonb_agg(jsonb_build_object(
              'product_name', item.product_name,
              'material', item.material,
              'unit_price', item.unit_price,
              'quantity', item.quantity,
              'products', case when product.id is null then null
                else jsonb_build_object('category', product.category, 'image_url', product.image_url)
              end
            ) order by item.product_name)
            from public.order_items item
            left join public.products product on product.id = item.product_id
            where item.order_id = orders.id
          ), '[]'::jsonb)
        ) as data
      from public.orders
    ) order_row
  );
end;
$$;
revoke all on function public.admin_list_orders(text) from public, authenticated;
grant execute on function public.admin_list_orders(text) to anon;

create or replace function public.admin_set_order_status(
  p_admin_token text, p_order_id uuid, p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
begin
  perform public.require_admin_session(p_admin_token);
  if p_status is null
     or p_status not in ('Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'Invalid order status.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.status <> p_status then
    if p_status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, true);
    elsif v_order.status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, false);
    end if;
    update public.orders set status = p_status, updated_at = now()
    where id = v_order.id returning * into v_order;
  end if;
  return to_jsonb(v_order);
end;
$$;
revoke all on function public.admin_set_order_status(text, uuid, text) from public, authenticated;
grant execute on function public.admin_set_order_status(text, uuid, text) to anon;

create or replace function public.admin_set_order_details(
  p_admin_token text, p_order_id uuid, p_status text, p_payment_status text,
  p_tracking_number text, p_carrier text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
begin
  perform public.require_admin_session(p_admin_token);
  if p_status is null
     or p_status not in ('Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
     or p_payment_status is null
     or p_payment_status not in ('Paid', 'Waiting payment') then
    raise exception 'Invalid order or payment status.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.status <> p_status then
    if p_status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, true);
    elsif v_order.status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, false);
    end if;
  end if;
  update public.orders
  set status = p_status,
      payment_status = p_payment_status,
      tracking_number = nullif(trim(coalesce(p_tracking_number, '')), ''),
      carrier = nullif(trim(coalesce(p_carrier, '')), ''),
      updated_at = now()
  where id = v_order.id returning * into v_order;
  return to_jsonb(v_order);
end;
$$;
revoke all on function public.admin_set_order_details(text, uuid, text, text, text, text) from public, authenticated;
grant execute on function public.admin_set_order_details(text, uuid, text, text, text, text) to anon;

create or replace function public.admin_set_orders_status(
  p_admin_token text, p_order_ids uuid[], p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_results jsonb := '[]'::jsonb;
begin
  perform public.require_admin_session(p_admin_token);
  if coalesce(array_length(p_order_ids, 1), 0) > 500 then
    raise exception 'Too many orders in one request.';
  end if;
  foreach v_order_id in array coalesce(p_order_ids, '{}'::uuid[]) loop
    v_results := v_results || jsonb_build_array(
      public.admin_set_order_status(p_admin_token, v_order_id, p_status)
    );
  end loop;
  return v_results;
end;
$$;
revoke all on function public.admin_set_orders_status(text, uuid[], text) from public, authenticated;
grant execute on function public.admin_set_orders_status(text, uuid[], text) to anon;

create or replace function public.admin_save_product(p_admin_token text, p_product jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.products%rowtype;
  v_stock integer;
begin
  perform public.require_admin_session(p_admin_token);
  if jsonb_typeof(p_product) is distinct from 'object'
     or coalesce((p_product->>'id')::bigint, 0) < 1
     or length(trim(coalesce(p_product->>'name', ''))) = 0
     or coalesce((p_product->>'price')::numeric, 0) not between 2000 and 20000 then
    raise exception 'A valid product ID, name, and price between 2,000 and 20,000 are required.';
  end if;
  if p_product ? 'stock' and p_product->>'stock' is not null and p_product->>'stock' <> '' then
    v_stock := (p_product->>'stock')::integer;
    if v_stock < 0 then raise exception 'Stock must be a non-negative whole number or empty.'; end if;
  else
    v_stock := null;
  end if;
  if jsonb_typeof(coalesce(p_product->'attributes', '[]'::jsonb)) <> 'array' then
    raise exception 'Product attributes must be a list.';
  end if;

  insert into public.products (
    id, name, category, material, description, price, image_url, stock, attributes, updated_at
  ) values (
    (p_product->>'id')::bigint,
    trim(p_product->>'name'),
    trim(coalesce(p_product->>'category', '')),
    trim(coalesce(p_product->>'material', '')),
    trim(coalesce(p_product->>'description', '')),
    (p_product->>'price')::numeric,
    trim(coalesce(p_product->>'image_url', '')),
    v_stock,
    coalesce(p_product->'attributes', '[]'::jsonb),
    now()
  )
  on conflict (id) do update set
    name = excluded.name, category = excluded.category, material = excluded.material,
    description = excluded.description, price = excluded.price, image_url = excluded.image_url,
    stock = excluded.stock, attributes = excluded.attributes, updated_at = now()
  returning * into v_product;
  return to_jsonb(v_product);
end;
$$;
revoke all on function public.admin_save_product(text, jsonb) from public, authenticated;
grant execute on function public.admin_save_product(text, jsonb) to anon;

create or replace function public.admin_delete_product(p_admin_token text, p_product_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_admin_session(p_admin_token);
  delete from public.products where id = p_product_id;
  return found;
end;
$$;
revoke all on function public.admin_delete_product(text, bigint) from public, authenticated;
grant execute on function public.admin_delete_product(text, bigint) to anon;

create or replace function public.admin_list_customers(p_admin_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_admin_session(p_admin_token);
  return coalesce((
    select jsonb_agg(to_jsonb(profile) order by profile.created_at desc)
    from public.profiles profile
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_list_customers(text) from public, authenticated;
grant execute on function public.admin_list_customers(text) to anon;

create or replace function public.admin_list_custom_design_requests(p_admin_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_admin_session(p_admin_token);
  return coalesce((
    select jsonb_agg(to_jsonb(request) order by request.created_at desc)
    from public.custom_design_requests request
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_list_custom_design_requests(text) from public, authenticated;
grant execute on function public.admin_list_custom_design_requests(text) to anon;

create or replace function public.admin_set_custom_design_status(
  p_admin_token text, p_request_id uuid, p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.custom_design_requests%rowtype;
begin
  perform public.require_admin_session(p_admin_token);
  if p_status not in ('New', 'Contacted', 'In Progress', 'Completed', 'Cancelled') then
    raise exception 'Invalid custom request status.';
  end if;
  update public.custom_design_requests
  set status = p_status, updated_at = now()
  where id = p_request_id returning * into v_request;
  if not found then raise exception 'Custom design request not found.'; end if;
  return to_jsonb(v_request);
end;
$$;
revoke all on function public.admin_set_custom_design_status(text, uuid, text) from public, authenticated;
grant execute on function public.admin_set_custom_design_status(text, uuid, text) to anon;

create or replace function public.admin_list_contact_requests(p_admin_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_admin_session(p_admin_token);
  return coalesce((
    select jsonb_agg(to_jsonb(request) order by request.created_at desc)
    from public.contact_requests request
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_list_contact_requests(text) from public, authenticated;
grant execute on function public.admin_list_contact_requests(text) to anon;

create or replace function public.create_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order orders%rowtype;
  v_items jsonb;
  v_total numeric(12,2);
  v_count integer;
  v_order_no text;
  v_attempt integer;
  v_auth_user_id uuid := auth.uid();
begin
  if v_auth_user_id is null then
    raise exception 'Please sign in before placing an order.';
  end if;

  if length(trim(coalesce(p_payload->>'customer_name', ''))) < 2
     or length(trim(coalesce(p_payload->>'address', ''))) < 8
     or length(trim(coalesce(p_payload->>'city', ''))) = 0
     or coalesce(p_payload->>'phone', '') !~ '^[6-9][0-9]{9}$'
     or coalesce(p_payload->>'pincode', '') !~ '^[0-9]{6}$'
     or coalesce(p_payload->>'payment_method', '') not in ('COD', 'UPI') then
    raise exception 'Please check the customer and payment details.';
  end if;

  if jsonb_typeof(p_payload->'items') is distinct from 'array' then
    raise exception 'Order items are missing.';
  end if;

  select count(*) into v_count
  from jsonb_to_recordset(p_payload->'items') as item(product_id bigint, quantity integer);
  if v_count < 1 then
    raise exception 'An order must contain at least one item.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_payload->'items') as item(product_id bigint, quantity integer)
    left join products product on product.id = item.product_id
    where item.product_id is null or item.quantity is null or item.quantity < 1 or product.id is null
  ) then
    raise exception 'An order contains an invalid product or quantity.';
  end if;

  if p_payload->>'payment_method' = 'UPI'
     and (p_payload->>'payment_reference') !~ '^[A-Za-z0-9]{10,25}$' then
    raise exception 'Please provide a valid UPI transaction reference.';
  end if;

  select round(sum(product.price * item.quantity), 2) into v_total
  from jsonb_to_recordset(p_payload->'items') as item(product_id bigint, quantity integer)
  join products product on product.id = item.product_id;

  for v_attempt in 1..5 loop
    v_order_no := 'EJ-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into orders (
        order_no, auth_user_id, customer_name, phone, address, city, pincode,
        payment_method, payment_reference, total, status, payment_status
      ) values (
        v_order_no,
        v_auth_user_id,
        trim(p_payload->>'customer_name'),
        trim(p_payload->>'phone'),
        trim(p_payload->>'address'),
        trim(p_payload->>'city'),
        trim(p_payload->>'pincode'),
        p_payload->>'payment_method',
        nullif(trim(coalesce(p_payload->>'payment_reference', '')), ''),
        v_total,
        'Placed',
        case when p_payload->>'payment_method' = 'UPI' then 'Paid' else 'Waiting payment' end
      ) returning * into v_order;
      exit;
    exception when unique_violation then
      if v_attempt = 5 then raise; end if;
    end;
  end loop;

  insert into order_items (order_id, product_id, product_name, material, unit_price, quantity)
  select v_order.id, product.id, product.name, product.material, product.price, item.quantity
  from jsonb_to_recordset(p_payload->'items') as item(product_id bigint, quantity integer)
  join products product on product.id = item.product_id;

  perform public.apply_order_inventory(v_order.id, false);

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', order_item.product_id,
    'product_name', order_item.product_name,
    'category', product.category,
    'material', order_item.material,
    'unit_price', order_item.unit_price,
    'quantity', order_item.quantity
  ) order by order_item.product_name), '[]'::jsonb)
  into v_items
  from order_items order_item
  left join products product on product.id = order_item.product_id
  where order_item.order_id = v_order.id;

  return jsonb_build_object(
    'id', v_order.id,
    'order_no', v_order.order_no,
    'total', v_order.total,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

create or replace function public.cancel_my_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Please sign in to cancel an order.';
  end if;

  update orders
  set status = 'Cancelled', updated_at = now()
  where id = p_order_id
    and auth_user_id = auth.uid()
    and status in ('Placed', 'Pending')
  returning * into v_order;

  if not found then
    raise exception 'This order cannot be cancelled. It may already be processing, shipped, delivered, or cancelled.';
  end if;

  perform public.apply_order_inventory(v_order.id, true);

  return jsonb_build_object(
    'id', v_order.id,
    'order_no', v_order.order_no,
    'status', v_order.status,
    'updated_at', v_order.updated_at
  );
end;
$$;

create or replace function public.set_admin_order_status(p_order_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order orders%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.is_admin
  ) then
    raise exception 'Administrator access is required.';
  end if;

  if p_status is null or p_status not in ('Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'Invalid order status.';
  end if;

  select * into v_order
  from orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.status <> p_status then
    if p_status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, true);
    elsif v_order.status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, false);
    end if;
  end if;
  update orders set status = p_status, updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return jsonb_build_object('id', v_order.id, 'order_no', v_order.order_no, 'status', v_order.status);
end;
$$;

create or replace function public.set_admin_order_details(
  p_order_id uuid,
  p_status text,
  p_payment_status text,
  p_tracking_number text,
  p_carrier text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order orders%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if p_status is null or p_status not in ('Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')
     or p_payment_status is null or p_payment_status not in ('Paid', 'Waiting payment') then
    raise exception 'Invalid order status or payment status.';
  end if;

  select * into v_order
  from orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.status <> p_status then
    if p_status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, true);
    elsif v_order.status = 'Cancelled' then
      perform public.apply_order_inventory(v_order.id, false);
    end if;
  end if;

  update orders
  set status = p_status,
      payment_status = p_payment_status,
      tracking_number = nullif(trim(coalesce(p_tracking_number, '')), ''),
      carrier = nullif(trim(coalesce(p_carrier, '')), ''),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return jsonb_build_object(
    'id', v_order.id,
    'order_no', v_order.order_no,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'tracking_number', v_order.tracking_number,
    'carrier', v_order.carrier
  );
end;
$$;

create or replace function public.set_admin_orders_status(p_order_ids uuid[], p_status text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_order orders%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.is_admin
  ) then
    raise exception 'Administrator access is required.';
  end if;

  if p_status is null or p_status not in ('Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'Invalid order status.';
  end if;

  v_count := 0;
  for v_order in
    select * from orders
    where id = any(p_order_ids)
    order by id
    for update
  loop
    if v_order.status <> p_status then
      if p_status = 'Cancelled' then
        perform public.apply_order_inventory(v_order.id, true);
      elsif v_order.status = 'Cancelled' then
        perform public.apply_order_inventory(v_order.id, false);
      end if;
    end if;
    update orders set status = p_status, updated_at = now()
    where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.create_custom_design_request(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if length(trim(coalesce(p_payload->>'name', ''))) < 2
     or coalesce(p_payload->>'phone', '') !~ '^[6-9][0-9]{9}$'
     or length(trim(coalesce(p_payload->>'type', ''))) = 0
     or length(trim(coalesce(p_payload->>'material', ''))) = 0
     or length(trim(coalesce(p_payload->>'occasion', ''))) = 0
     or length(trim(coalesce(p_payload->>'style', ''))) = 0
     or length(trim(coalesce(p_payload->>'message', ''))) < 10 then
    raise exception 'Please check the required custom design details.';
  end if;

  insert into custom_design_requests (
    name, phone, jewellery_type, material, occasion, preferred_style,
    budget, needed_by, reference_url, message, status
  ) values (
    trim(p_payload->>'name'),
    trim(p_payload->>'phone'),
    trim(p_payload->>'type'),
    trim(p_payload->>'material'),
    trim(p_payload->>'occasion'),
    trim(p_payload->>'style'),
    nullif(trim(coalesce(p_payload->>'budget', '')), ''),
    nullif(p_payload->>'date', '')::date,
    nullif(trim(coalesce(p_payload->>'referenceUrl', '')), ''),
    trim(p_payload->>'message'),
    'New'
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.create_contact_request(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if length(trim(coalesce(p_payload->>'name', ''))) < 2
     or coalesce(p_payload->>'phone', '') !~ '^[6-9][0-9]{9}$'
     or length(trim(coalesce(p_payload->>'message', ''))) < 3 then
    raise exception 'Please check your name, mobile number, and question.';
  end if;

  insert into contact_requests (name, phone, message, status)
  values (
    trim(p_payload->>'name'),
    trim(p_payload->>'phone'),
    trim(p_payload->>'message'),
    'New'
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
revoke all on function public.cancel_my_order(uuid) from public, anon, authenticated;
revoke all on function public.set_admin_order_status(uuid, text) from public, anon, authenticated;
revoke all on function public.set_admin_order_details(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.set_admin_orders_status(uuid[], text) from public, anon, authenticated;
revoke all on function public.create_custom_design_request(jsonb) from public, anon, authenticated;
revoke all on function public.create_contact_request(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.set_admin_order_status(uuid, text) to authenticated;
grant execute on function public.set_admin_order_details(uuid, text, text, text, text) to authenticated;
grant execute on function public.set_admin_orders_status(uuid[], text) to authenticated;
grant execute on function public.create_custom_design_request(jsonb) to anon, authenticated;
grant execute on function public.create_contact_request(jsonb) to anon, authenticated;
