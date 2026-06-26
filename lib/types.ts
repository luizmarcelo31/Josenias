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

export type RecipeItem = {
  materialId: string
  quantity: number // quantity per 1 unit of product
}

export type Product = {
  id: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  stockQuantity?: number // @legacy - ignorado no fluxo de vendas
  minStockQuantity?: number // @legacy
  unit: Unit
  sku: string
  emoji: string
  imageUrl?: string
  isFrequent: boolean
  isActive: boolean
  recipe?: RecipeItem[]
  createdAt: number
  updatedAt: number
}

export type MaterialUnit = 'kg' | 'g' | 'L' | 'ml' | 'un' | 'cx' | 'pct'

export type Material = {
  id: string
  name: string
  unit: MaterialUnit
  stockQuantity: number
  minStockQuantity: number
  costPrice: number
  supplier?: string
  expirationDate?: string // ISO string format YYYY-MM-DD
  linkedProducts?: string[] // reservado para ficha técnica futura
  createdAt: number
  updatedAt: number
}

export type MovementType = 'entrada' | 'saida' | 'perda' | 'producao' | 'estorno_producao'

export type ProductionSnapshotItem = {
  materialId: string
  materialName: string
  amountPerUnit: number
  totalAmount: number
  unit: MaterialUnit
}

export type ProductionSnapshot = {
  productId: string
  productName: string
  quantity: number
  recipeUsed: ProductionSnapshotItem[]
  producedAt: number // timestamp
}

export type StockMovement = {
  id: string
  materialId: string
  type: MovementType
  quantity: number
  note?: string
  saleId?: string // reference to sale
  productionId?: string // reference to a production batch
  productionSnapshot?: ProductionSnapshot // snapshot of recipe at production time
  reversedMovementId?: string // for estorno_producao, references the original producao
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

export function getMaterialStockStatus(m: Material): StockStatus {
  if (m.stockQuantity <= 0) return 'esgotado'
  if (m.stockQuantity <= m.minStockQuantity * 0.5) return 'critico'
  if (m.stockQuantity <= m.minStockQuantity) return 'baixo'
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
