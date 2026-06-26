import type { Category, Product } from './types'

const now = Date.now()

export const seedCategories: Category[] = [
  { id: 'c1', name: 'Pães', description: 'Pães frescos do dia', color: '#F59E0B', icon: '🥖', createdAt: now, updatedAt: now },
  { id: 'c2', name: 'Bebidas', description: 'Cafés, sucos e mais', color: '#06B6D4', icon: '☕', createdAt: now, updatedAt: now },
  { id: 'c3', name: 'Bolos', description: 'Bolos e tortas', color: '#EC4899', icon: '🍰', createdAt: now, updatedAt: now },
  { id: 'c4', name: 'Salgados', description: 'Salgados assados e fritos', color: '#EF4444', icon: '🥟', createdAt: now, updatedAt: now },
  { id: 'c5', name: 'Frios', description: 'Frios e laticínios', color: '#3C50E0', icon: '🧀', createdAt: now, updatedAt: now },
  { id: 'c6', name: 'Doces', description: 'Doces e confeitaria', color: '#22C55E', icon: '🍩', createdAt: now, updatedAt: now },
]

function p(
  id: string,
  name: string,
  categoryId: string,
  cost: number,
  sale: number,
  stock: number,
  min: number,
  emoji: string,
  frequent = false,
): Product {
  return {
    id,
    name,
    categoryId,
    costPrice: cost,
    salePrice: sale,
    stockQuantity: stock,
    minStockQuantity: min,
    unit: 'un',
    sku: `SKU${id.padStart(4, '0')}`,
    emoji,
    isFrequent: frequent,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export const seedProducts: Product[] = [
  p('1', 'Pão Francês', 'c1', 0.3, 0.75, 320, 100, '🥖', true),
  p('2', 'Café Expresso', 'c2', 1.2, 5.0, 80, 20, '☕', true),
  p('3', 'Bolo de Cenoura', 'c3', 3.5, 8.5, 6, 8, '🍰'),
  p('4', 'Coxinha', 'c4', 2.0, 6.0, 45, 30, '🥟', true),
  p('5', 'Leite', 'c2', 3.0, 4.5, 12, 15, '🥛', true),
  p('6', 'Queijo Mussarela', 'c5', 22.0, 35.0, 8, 5, '🧀'),
  p('7', 'Pão de Queijo', 'c4', 0.6, 1.5, 0, 40, '🧆', true),
  p('8', 'Croissant', 'c1', 2.5, 7.0, 18, 10, '🥐'),
  p('9', 'Suco de Laranja', 'c2', 2.5, 6.5, 25, 10, '🧃'),
  p('10', 'Sonho', 'c6', 2.0, 5.5, 14, 10, '🍩'),
]
