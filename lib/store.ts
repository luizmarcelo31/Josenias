import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import type {
  Category,
  MovementType,
  PaymentMethod,
  Product,
  Sale,
  StockMovement,
} from './types'
import { seedCategories, seedProducts } from './seed'

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export type CartItem = {
  productId: string
  name: string
  emoji: string
  unitPrice: number
  quantity: number
  stockQuantity: number
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

type StoreState = {
  // Data
  categories: Category[]
  products: Product[]
  movements: StockMovement[]
  sales: Sale[]

  // Categories CRUD
  addCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCategory: (id: string, data: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // Products CRUD
  addProduct: (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void
  updateProduct: (id: string, data: Partial<Product>) => void
  deleteProduct: (id: string) => void
  toggleProductActive: (id: string) => void

  // Stock
  adjustStock: (
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string,
    observation: string,
  ) => void

  // Cart
  cart: CartItem[]
  addToCart: (product: Product, quantity: number) => void
  updateCartQty: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void

  // Numpad
  numpadProduct: Product | null
  numpadValue: string
  lastQuantities: Record<string, number>
  openNumpad: (product: Product) => void
  closeNumpad: () => void
  appendNumpad: (digit: string) => void
  deleteNumpad: () => void
  clearNumpad: () => void
  confirmNumpad: () => void

  // UI
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  isCheckoutOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void

  // Sales
  completeSale: (method: PaymentMethod) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      products: seedProducts,
      movements: [],
      sales: [],

      addCategory: (data) =>
        set((state) => {
          const ts = Date.now()
          return {
            categories: [
              ...state.categories,
              { ...data, id: uid(), createdAt: ts, updatedAt: ts },
            ],
          }
        }),
      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c,
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          products: state.products.filter((p) => p.categoryId !== id),
        })),

      addProduct: (data) =>
        set((state) => {
          const ts = Date.now()
          return {
            products: [
              ...state.products,
              { ...data, id: uid(), createdAt: ts, updatedAt: ts },
            ],
          }
        }),
      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p,
          ),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      toggleProductActive: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, isActive: !p.isActive, updatedAt: Date.now() }
              : p,
          ),
        })),

      adjustStock: (productId, type, quantity, reason, observation) =>
        set((state) => {
          const product = state.products.find((p) => p.id === productId)
          if (!product) return state
          const previous = product.stockQuantity
          let next = previous
          if (type === 'ajuste') next = quantity
          else if (type === 'entrada_compra' || type === 'entrada_venda')
            next = previous + quantity
          else next = previous - quantity
          next = Math.max(0, next)
          const movement: StockMovement = {
            id: uid(),
            productId,
            type,
            quantity,
            previousQuantity: previous,
            newQuantity: next,
            reason,
            observation,
            createdAt: Date.now(),
          }
          return {
            products: state.products.map((p) =>
              p.id === productId
                ? { ...p, stockQuantity: next, updatedAt: Date.now() }
                : p,
            ),
            movements: [movement, ...state.movements],
          }
        }),

      cart: [],
      addToCart: (product, quantity) =>
        set((state) => {
          if (quantity <= 0) return state
          const existing = state.cart.find((i) => i.productId === product.id)
          const currentQty = existing ? existing.quantity : 0
          const finalQty = Math.min(currentQty + quantity, product.stockQuantity)
          
          if (finalQty <= 0) return state

          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: finalQty, stockQuantity: product.stockQuantity }
                  : i,
              ),
            }
          }
          return {
            cart: [
              ...state.cart,
              {
                productId: product.id,
                name: product.name,
                emoji: product.emoji,
                unitPrice: product.salePrice,
                quantity: finalQty,
                stockQuantity: product.stockQuantity,
              },
            ],
          }
        }),
      updateCartQty: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { cart: state.cart.filter((i) => i.productId !== productId) }
          }
          const product = state.products.find((p) => p.id === productId)
          if (!product) return state

          const finalQty = Math.min(quantity, product.stockQuantity)
          if (finalQty <= 0) {
            return { cart: state.cart.filter((i) => i.productId !== productId) }
          }

          return {
            cart: state.cart.map((i) =>
              i.productId === productId ? { ...i, quantity: finalQty, stockQuantity: product.stockQuantity } : i,
            ),
          }
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.productId !== productId),
        })),
      clearCart: () => set({ cart: [] }),

      numpadProduct: null,
      numpadValue: '0',
      lastQuantities: {},
      openNumpad: (product) =>
        set((state) => {
          const last = state.lastQuantities[product.id]
          return {
            numpadProduct: product,
            numpadValue: last ? String(last) : '1',
          }
        }),
      closeNumpad: () => set({ numpadProduct: null, numpadValue: '0' }),
      appendNumpad: (digit) =>
        set((state) => {
          const current = state.numpadValue === '0' ? '' : state.numpadValue
          const next = (current + digit).slice(0, 4)
          return { numpadValue: next === '' ? '0' : next }
        }),
      deleteNumpad: () =>
        set((state) => {
          const next = state.numpadValue.slice(0, -1)
          return { numpadValue: next === '' ? '0' : next }
        }),
      clearNumpad: () => set({ numpadValue: '0' }),
      confirmNumpad: () => {
        const { numpadProduct, numpadValue, addToCart } = get()
        if (!numpadProduct) return
        const qty = Number.parseInt(numpadValue, 10) || 0
        if (qty <= 0) return
        addToCart(numpadProduct, qty)
        set((state) => ({
          lastQuantities: {
            ...state.lastQuantities,
            [numpadProduct.id]: qty,
          },
          numpadProduct: null,
          numpadValue: '0',
        }))
      },

      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      isCheckoutOpen: false,
      openCheckout: () => set({ isCheckoutOpen: true, isCartOpen: false }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      completeSale: (method) => {
        const { cart, products } = get()
        if (cart.length === 0) return
        const total = cart.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity,
          0,
        )
        const sale: Sale = {
          id: uid(),
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            emoji: i.emoji,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.unitPrice * i.quantity,
          })),
          total,
          method,
          createdAt: Date.now(),
        }
        // Deduct stock
        const updatedProducts = products.map((p) => {
          const item = cart.find((i) => i.productId === p.id)
          if (!item) return p
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - item.quantity),
            updatedAt: Date.now(),
          }
        })
        set((state) => ({
          sales: [sale, ...state.sales],
          products: updatedProducts,
          cart: [],
          isCheckoutOpen: false,
          isCartOpen: false,
        }))
      },
    }),
    {
      name: 'bakeryflow-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        categories: state.categories,
        products: state.products,
        movements: state.movements,
        sales: state.sales,
        lastQuantities: state.lastQuantities,
      }),
    },
  ),
)

// Selectors
export const selectTotalItems = (s: StoreState) =>
  s.cart.reduce((sum, i) => sum + i.quantity, 0)
export const selectTotalPrice = (s: StoreState) =>
  s.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
