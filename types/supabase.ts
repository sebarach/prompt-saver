export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string
          user_id: string
          type: 'prompt' | 'command'
          category: string
          title: string
          content: string
          description: string | null
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          type: 'prompt' | 'command'
          category: string
          title: string
          content: string
          description?: string | null
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'prompt' | 'command'
          category?: string
          title?: string
          content?: string
          description?: string | null
          tags?: string[]
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          created_at?: string
        }
      }
    }
  }
}