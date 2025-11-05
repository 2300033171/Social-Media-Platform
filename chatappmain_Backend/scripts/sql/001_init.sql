-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on posts (created_at desc);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_id_idx on comments (post_id);

-- Likes
create table if not exists likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Follows
create table if not exists follows (
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_recipient_id_idx on messages (recipient_id);
