import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// O cliente só é criado se as variáveis de ambiente estiverem configuradas
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          color: string
          icon: string
          created_at: number
          updated_at: number
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
      }
      products: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          name: string
          cost_price: number
          sale_price: number
          stock_quantity: number
          min_stock_quantity: number
          unit: 'un' | 'kg' | 'L'
          sku: string
          emoji: string
          image_url: string | null
          is_frequent: boolean
          is_active: boolean
          created_at: number
          updated_at: number
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      stock_movements: {
        Row: {
          id: string
          user_id: string
          product_id: string
          type: 'entrada_venda' | 'entrada_compra' | 'saida_venda' | 'perda' | 'ajuste'
          quantity: number
          previous_quantity: number
          new_quantity: number
          reason: string
          observation: string
          created_at: number
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id'> & { id?: string }
        Update: never
      }
      sales: {
        Row: {
          id: string
          user_id: string
          total: number
          method: 'dinheiro' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'pix'
          items: Array<{
            productId: string
            name: string
            emoji: string
            quantity: number
            unitPrice: number
            subtotal: number
          }>
          created_at: number
        }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id'> & { id?: string }
        Update: never
      }
    }
  }
}
