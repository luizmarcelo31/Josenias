export type Unit = 'un' | 'kg' | 'L'

export type Category = {
  id: string
  name: string
  description: string
  color: string
  icon: string
  createdAt: number
  updatedAt: number
}

export type Product = {
  id: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  minStockQuantity: number
  unit: Unit
  sku: string
  emoji: string
  imageUrl?: string
  isFrequent: boolean
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export type MovementType =
  | 'entrada_venda'
  | 'entrada_compra'
  | 'saida_venda'
  | 'perda'
  | 'ajuste'

export type StockMovement = {
  id: string
  productId: string
  type: MovementType
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  observation: string
  createdAt: number
}

export type PaymentMethod = 'dinheiro' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'pix'

export type SaleItem = {
  productId: string
  name: string
  emoji: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export type Sale = {
  id: string
  items: SaleItem[]
  total: number
  method: PaymentMethod
  createdAt: number
}

export type StockStatus = 'ok' | 'baixo' | 'critico' | 'esgotado'

export const CATEGORY_COLORS = [
  { name: 'Indigo', value: '#3C50E0' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Âmbar', value: '#F59E0B' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Verde', value: '#22C55E' },
]

export const CATEGORY_ICONS = [
  '🥖',
  '🥐',
  '🍰',
  '🥟',
  '☕',
  '🥛',
  '🧀',
  '🍩',
  '🧃',
  '🍪',
  '🥧',
  '🍞',
]

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'un', label: 'Unidade' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'L', label: 'Litro' },
]

export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function getMargin(cost: number, sale: number) {
  if (sale <= 0) return 0
  return ((sale - cost) / sale) * 100
}

export function getStockStatus(p: Product): StockStatus {
  if (p.stockQuantity <= 0) return 'esgotado'
  if (p.stockQuantity <= p.minStockQuantity * 0.5) return 'critico'
  if (p.stockQuantity <= p.minStockQuantity) return 'baixo'
  return 'ok'
}

export const STOCK_STATUS_META: Record<
  StockStatus,
  { label: string; color: string; bg: string }
> = {
  ok: { label: 'OK', color: 'text-success', bg: 'bg-success/10' },
  baixo: { label: 'Baixo', color: 'text-warning', bg: 'bg-warning/10' },
  critico: { label: 'Crítico', color: 'text-danger', bg: 'bg-danger/10' },
  esgotado: { label: 'Esgotado', color: 'text-danger', bg: 'bg-danger/15' },
}
