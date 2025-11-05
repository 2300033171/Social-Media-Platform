export type ID = string

export interface User {
  id: ID
  username: string
  name?: string
  avatarUrl?: string
  createdAt: string // ISO
}

export interface Post {
  id: ID
  userId: ID
  content: string
  imageUrl?: string
  createdAt: string // ISO
}

export interface Comment {
  id: ID
  postId: ID
  userId: ID
  content: string
  createdAt: string // ISO
}

export interface Follow {
  followerId: ID
  followingId: ID
  createdAt: string // ISO
}

export interface Message {
  id: ID
  senderId: ID
  recipientId: ID
  content: string
  createdAt: string // ISO
}

export interface ListOptions {
  limit?: number
  cursor?: string // ISO timestamp cursor or id-based
}
