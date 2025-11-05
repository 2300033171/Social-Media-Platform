import "server-only"
import { randomUUID } from "crypto"
import { neon } from "@neondatabase/serverless"
import type { Comment, ID, Message, Post, User, ListOptions } from "./types"

type DB = {
  // users
  createUser(input: { username: string; name?: string; avatarUrl?: string }): Promise<User>
  getUserById(id: ID): Promise<User | null>
  getUserByUsername(username: string): Promise<User | null>

  // posts
  createPost(input: { userId: ID; content: string; imageUrl?: string }): Promise<Post>
  listPosts(opts?: ListOptions): Promise<Post[]>
  getPostById(id: ID): Promise<Post | null>

  // comments
  addComment(input: { postId: ID; userId: ID; content: string }): Promise<Comment>
  listComments(postId: ID, opts?: ListOptions): Promise<Comment[]>

  // likes
  toggleLike(postId: ID, userId: ID): Promise<{ liked: boolean; likesCount: number }>
  countLikes(postId: ID): Promise<number>

  // follows
  follow(followerId: ID, followingId: ID): Promise<{ following: boolean }>
  isFollowing(followerId: ID, followingId: ID): Promise<boolean>

  // messages (simple)
  sendMessage(input: { senderId: ID; recipientId: ID; content: string }): Promise<Message>
}

const hasNeon = !!process.env.DATABASE_URL

export function getDb(): DB {
  return hasNeon ? createNeonDb() : createMemoryDb()
}

/* In-memory fallback for easy testing */
function createMemoryDb(): DB {
  const users = new Map<ID, User>()
  const posts = new Map<ID, Post>()
  const comments = new Map<ID, Comment>()
  const likes = new Map<ID, Set<ID>>() // postId -> set of userIds
  const follows = new Map<ID, Set<ID>>() // followerId -> set of followingIds
  const messages = new Map<ID, Message>()

  const now = () => new Date().toISOString()

  return {
    async createUser({ username, name, avatarUrl }) {
      // simple uniqueness check
      for (const u of users.values()) {
        if (u.username.toLowerCase() === username.toLowerCase()) {
          throw new Error("Username already exists")
        }
      }
      const id = randomUUID()
      const user: User = { id, username, name, avatarUrl, createdAt: now() }
      users.set(id, user)
      return user
    },
    async getUserById(id) {
      return users.get(id) ?? null
    },
    async getUserByUsername(username) {
      for (const u of users.values()) {
        if (u.username.toLowerCase() === username.toLowerCase()) return u
      }
      return null
    },
    async createPost({ userId, content, imageUrl }) {
      if (!users.has(userId)) throw new Error("Invalid user")
      const id = randomUUID()
      const post: Post = { id, userId, content, imageUrl, createdAt: now() }
      posts.set(id, post)
      return post
    },
    async listPosts({ limit = 20 }: ListOptions = {}) {
      const all = Array.from(posts.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return all.slice(0, Math.min(limit, 100))
    },
    async getPostById(id) {
      return posts.get(id) ?? null
    },
    async addComment({ postId, userId, content }) {
      if (!posts.has(postId)) throw new Error("Invalid post")
      if (!users.has(userId)) throw new Error("Invalid user")
      const id = randomUUID()
      const c: Comment = { id, postId, userId, content, createdAt: now() }
      comments.set(id, c)
      return c
    },
    async listComments(postId, { limit = 50 }: ListOptions = {}) {
      const all = Array.from(comments.values())
        .filter((c) => c.postId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return all.slice(0, Math.min(limit, 200))
    },
    async toggleLike(postId, userId) {
      if (!posts.has(postId)) throw new Error("Invalid post")
      if (!users.has(userId)) throw new Error("Invalid user")
      const set = likes.get(postId) ?? new Set<ID>()
      let liked = false
      if (set.has(userId)) {
        set.delete(userId)
        liked = false
      } else {
        set.add(userId)
        liked = true
      }
      likes.set(postId, set)
      return { liked, likesCount: set.size }
    },
    async countLikes(postId) {
      return likes.get(postId)?.size ?? 0
    },
    async follow(followerId, followingId) {
      if (!users.has(followerId) || !users.has(followingId)) throw new Error("Invalid user(s)")
      const set = follows.get(followerId) ?? new Set<ID>()
      if (set.has(followingId)) {
        set.delete(followingId)
        follows.set(followerId, set)
        return { following: false }
      }
      set.add(followingId)
      follows.set(followerId, set)
      return { following: true }
    },
    async isFollowing(followerId, followingId) {
      return follows.get(followerId)?.has(followingId) ?? false
    },
    async sendMessage({ senderId, recipientId, content }) {
      if (!users.has(senderId) || !users.has(recipientId)) throw new Error("Invalid user(s)")
      const id = randomUUID()
      const msg: Message = { id, senderId, recipientId, content, createdAt: now() }
      messages.set(id, msg)
      return msg
    },
  }
}

/* Neon Postgres implementation */
function createNeonDb(): DB {
  const sql = neon(process.env.DATABASE_URL as string)

  return {
    async createUser({ username, name, avatarUrl }) {
      const rows = await sql<User[]>`
        insert into users (username, name, avatar_url)
        values (${username}, ${name ?? null}, ${avatarUrl ?? null})
        returning id, username, name, avatar_url as "avatarUrl", created_at as "createdAt"
      `
      return rows[0]
    },
    async getUserById(id) {
      const rows = await sql<User[]>`
        select id, username, name, avatar_url as "avatarUrl", created_at as "createdAt"
        from users where id = ${id} limit 1
      `
      return rows[0] ?? null
    },
    async getUserByUsername(username) {
      const rows = await sql<User[]>`
        select id, username, name, avatar_url as "avatarUrl", created_at as "createdAt"
        from users where lower(username) = lower(${username}) limit 1
      `
      return rows[0] ?? null
    },
    async createPost({ userId, content, imageUrl }) {
      const rows = await sql<Post[]>`
        insert into posts (user_id, content, image_url)
        values (${userId}, ${content}, ${imageUrl ?? null})
        returning id, user_id as "userId", content, image_url as "imageUrl", created_at as "createdAt"
      `
      return rows[0]
    },
    async listPosts({ limit = 20 }: ListOptions = {}) {
      const rows = await sql<Post[]>`
        select id, user_id as "userId", content, image_url as "imageUrl", created_at as "createdAt"
        from posts
        order by created_at desc
        limit ${Math.min(limit, 100)}
      `
      return rows
    },
    async getPostById(id) {
      const rows = await sql<Post[]>`
        select id, user_id as "userId", content, image_url as "imageUrl", created_at as "createdAt"
        from posts where id = ${id} limit 1
      `
      return rows[0] ?? null
    },
    async addComment({ postId, userId, content }) {
      const rows = await sql<Comment[]>`
        insert into comments (post_id, user_id, content)
        values (${postId}, ${userId}, ${content})
        returning id, post_id as "postId", user_id as "userId", content, created_at as "createdAt"
      `
      return rows[0]
    },
    async listComments(postId, { limit = 50 }: ListOptions = {}) {
      const rows = await sql<Comment[]>`
        select id, post_id as "postId", user_id as "userId", content, created_at as "createdAt"
        from comments
        where post_id = ${postId}
        order by created_at asc
        limit ${Math.min(limit, 200)}
      `
      return rows
    },
    async toggleLike(postId, userId) {
      // Try insert, if exists then delete (toggle)
      await sql`
        insert into likes (post_id, user_id)
        values (${postId}, ${userId})
        on conflict (post_id, user_id) do nothing
      `
      const inserted = await sql`
        select 1 from likes where post_id = ${postId} and user_id = ${userId} limit 1
      `
      // If already existed prior to insert, then we should delete to toggle off
      let liked = true
      if (inserted.length === 0) {
        // it existed, so we just removed due to ON CONFLICT DO NOTHING not removing; handle toggle by deleting
        await sql`delete from likes where post_id = ${postId} and user_id = ${userId}`
        liked = false
      } else {
        // check if we accidentally double toggled; ensure only one record exists
        // no-op
      }
      const countRows = await sql<{ count: string }[]>`
        select count(*)::text as count from likes where post_id = ${postId}
      `
      const likesCount = Number.parseInt(countRows[0].count, 10)
      return { liked, likesCount }
    },
    async countLikes(postId) {
      const rows = await sql<{ count: string }[]>`
        select count(*)::text as count from likes where post_id = ${postId}
      `
      return Number.parseInt(rows[0].count, 10)
    },
    async follow(followerId, followingId) {
      // toggle follow
      const exists = await sql`
        select 1 from follows where follower_id = ${followerId} and following_id = ${followingId} limit 1
      `
      if (exists.length) {
        await sql`delete from follows where follower_id = ${followerId} and following_id = ${followingId}`
        return { following: false }
      } else {
        await sql`
          insert into follows (follower_id, following_id)
          values (${followerId}, ${followingId})
          on conflict do nothing
        `
        return { following: true }
      }
    },
    async isFollowing(followerId, followingId) {
      const rows = await sql`
        select 1 from follows where follower_id = ${followerId} and following_id = ${followingId} limit 1
      `
      return rows.length > 0
    },
    async sendMessage({ senderId, recipientId, content }) {
      const rows = await sql<Message[]>`
        insert into messages (sender_id, recipient_id, content)
        values (${senderId}, ${recipientId}, ${content})
        returning id, sender_id as "senderId", recipient_id as "recipientId", content, created_at as "createdAt"
      `
      return rows[0]
    },
  }
}
