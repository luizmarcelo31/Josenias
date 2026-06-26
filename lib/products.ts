export type Product = {
  id: string
  name: string
  price: number
  category: string
  isFrequent: boolean
  emoji: string
}

export const mockProducts: Product[] = [
  { id: '1', name: 'Pão Francês', price: 0.75, category: 'Pães', isFrequent: true, emoji: '🥐' },
  { id: '2', name: 'Café Expresso', price: 5.0, category: 'Bebidas', isFrequent: true, emoji: '☕' },
  { id: '3', name: 'Bolo de Cenoura', price: 8.5, category: 'Bolos', isFrequent: false, emoji: '🍰' },
  { id: '4', name: 'Coxinha', price: 6.0, category: 'Salgados', isFrequent: true, emoji: '🥟' },
  { id: '5', name: 'Leite', price: 4.5, category: 'Bebidas', isFrequent: true, emoji: '🥛' },
  { id: '6', name: 'Queijo Mussarela', price: 35.0, category: 'Frios', isFrequent: false, emoji: '🧀' },
  { id: '7', name: 'Pão de Queijo', price: 1.5, category: 'Salgados', isFrequent: true, emoji: '🧆' },
  { id: '8', name: 'Croissant', price: 7.0, category: 'Pães', isFrequent: false, emoji: '🥐' },
  { id: '9', name: 'Suco de Laranja', price: 6.5, category: 'Bebidas', isFrequent: false, emoji: '🧃' },
  { id: '10', name: 'Sonho', price: 5.5, category: 'Doces', isFrequent: false, emoji: '🍩' },
]

export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
