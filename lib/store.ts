import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import type {
  Category,
  MovementType,
  PaymentMethod,
  Product,
  Material,
  Sale,
  StockMovement,
  ProductionSnapshot,
  ProductionSnapshotItem,
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
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

type StoreState = {
  // Data
  categories: Category[]
  products: Product[]
  materials: Material[]
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

  // Materials CRUD
  addMaterial: (data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMaterial: (id: string, data: Partial<Material>) => void
  deleteMaterial: (id: string) => void

  // Stock
  adjustMaterialStock: (
    materialId: string,
    type: MovementType,
    quantity: number,
    note?: string,
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
  lastSaleWarnings: string[]
  completeSale: (method: PaymentMethod) => void
  clearSales: () => void

  // Production
  produceProduct: (
    productId: string,
    quantity: number,
  ) => { success: boolean; warnings: string[]; errors: string[] }
  reverseProduction: (
    productionId: string,
  ) => { success: boolean; error?: string }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      products: seedProducts,
      materials: [],
      movements: [],
      sales: [],
      lastSaleWarnings: [],

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

      addMaterial: (data) =>
        set((state) => {
          const ts = Date.now()
          return {
            materials: [
              ...state.materials,
              { ...data, id: uid(), createdAt: ts, updatedAt: ts },
            ],
          }
        }),
      updateMaterial: (id, data) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: Date.now() } : m,
          ),
        })),
      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        })),

      adjustMaterialStock: (materialId, type, quantity, note) =>
        set((state) => {
          const material = state.materials.find((m) => m.id === materialId)
          if (!material) return state
          const previous = material.stockQuantity
          let next = previous
          if (type === 'entrada') next = previous + quantity
          else next = previous - quantity
          next = Math.max(0, next)
          const movement: StockMovement = {
            id: uid(),
            materialId,
            type,
            quantity,
            note,
            createdAt: Date.now(),
          }
          return {
            materials: state.materials.map((m) =>
              m.id === materialId
                ? { ...m, stockQuantity: next, updatedAt: Date.now() }
                : m,
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
          const finalQty = currentQty + quantity

          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: finalQty }
                  : i,
              ),
              lastSaleWarnings: [],
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
              },
            ],
            lastSaleWarnings: [],
          }
        }),
      updateCartQty: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { cart: state.cart.filter((i) => i.productId !== productId) }
          }
          return {
            cart: state.cart.map((i) =>
              i.productId === productId ? { ...i, quantity } : i,
            ),
          }
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.productId !== productId),
        })),
      clearCart: () => set({ cart: [], lastSaleWarnings: [] }),

      numpadProduct: null,
      numpadValue: '0',
      lastQuantities: {},
      openNumpad: (product) =>
        set((state) => {
          const last = state.lastQuantities[product.id]
          return {
            numpadProduct: product,
            numpadValue: last ? String(last) : '1',
            lastSaleWarnings: [],
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
        const { cart } = get()
        if (cart.length === 0) return
        const total = cart.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity,
          0,
        )
        const saleId = uid()
        const sale: Sale = {
          id: saleId,
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

        set((state) => ({
          sales: [sale, ...state.sales],
          cart: [],
          lastSaleWarnings: [],
          isCheckoutOpen: false,
          isCartOpen: false,
        }))
      },

      clearSales: () => set({ sales: [] }),

      produceProduct: (productId, quantity) => {
        const { products, materials } = get()
        const product = products.find((p) => p.id === productId)

        if (!product) return { success: false, warnings: [], errors: ['Produto não encontrado.'] }
        if (!product.recipe || product.recipe.length === 0)
          return { success: false, warnings: [], errors: ['Este produto não possui ficha técnica cadastrada.'] }
        if (quantity <= 0)
          return { success: false, warnings: [], errors: ['Quantidade deve ser maior que zero.'] }

        const errors: string[] = []
        const warnings: string[] = []

        // Pre-validate all ingredients before any mutation
        for (const recipeItem of product.recipe) {
          const mat = materials.find((m) => m.id === recipeItem.materialId)
          if (!mat) {
            errors.push(`Insumo não encontrado na ficha técnica.`)
            continue
          }
          const needed = recipeItem.quantity * quantity
          const afterDeduction = mat.stockQuantity - needed
          if (afterDeduction < 0) {
            errors.push(`Estoque insuficiente de ${mat.name}: precisa ${needed.toFixed(3)} ${mat.unit}, tem ${mat.stockQuantity} ${mat.unit}.`)
          } else if (afterDeduction < mat.minStockQuantity) {
            warnings.push(`${mat.name} ficará abaixo do mínimo (${afterDeduction.toFixed(3)}/${mat.minStockQuantity} ${mat.unit}).`)
          }
        }

        // Block if there are errors
        if (errors.length > 0) return { success: false, warnings, errors }

        // Build production snapshot
        const ts = Date.now()
        const productionId = uid()
        const snapshotItems: ProductionSnapshotItem[] = product.recipe
          .map((ri) => {
            const mat = materials.find((m) => m.id === ri.materialId)
            if (!mat) return null
            return {
              materialId: ri.materialId,
              materialName: mat.name,
              amountPerUnit: ri.quantity,
              totalAmount: Math.round(ri.quantity * quantity * 1000) / 1000,
              unit: mat.unit,
            } as ProductionSnapshotItem
          })
          .filter((x): x is ProductionSnapshotItem => x !== null)

        const snapshot: ProductionSnapshot = {
          productId,
          productName: product.name,
          quantity,
          recipeUsed: snapshotItems,
          producedAt: ts,
        }

        // Apply deductions
        const updatedMaterials = [...materials]
        const newMovements: StockMovement[] = []

        for (const item of snapshotItems) {
          const matIndex = updatedMaterials.findIndex((m) => m.id === item.materialId)
          if (matIndex === -1) continue
          const mat = updatedMaterials[matIndex]
          const nextStock = Math.round((mat.stockQuantity - item.totalAmount) * 1000) / 1000

          updatedMaterials[matIndex] = { ...mat, stockQuantity: nextStock, updatedAt: ts }
          newMovements.push({
            id: uid(),
            materialId: item.materialId,
            type: 'producao',
            quantity: item.totalAmount,
            note: `Produção: ${product.name} x${quantity}`,
            productionId,
            productionSnapshot: snapshot,
            createdAt: ts,
          })
        }

        set((state) => ({
          materials: updatedMaterials,
          movements: [...newMovements, ...state.movements],
        }))

        return { success: true, warnings, errors: [] }
      },

      reverseProduction: (productionId) => {
        const { movements, materials } = get()
        // Find all movements for this production batch
        const productionMovements = movements.filter(
          (m) => m.productionId === productionId && m.type === 'producao',
        )

        if (productionMovements.length === 0)
          return { success: false, error: 'Produção não encontrada.' }

        const firstMovement = productionMovements[0]
        const THIRTY_MINUTES = 30 * 60 * 1000
        if (Date.now() - firstMovement.createdAt > THIRTY_MINUTES)
          return { success: false, error: 'O prazo de 30 minutos para estorno expirou.' }

        // Check if already reversed
        const alreadyReversed = movements.some(
          (m) => m.type === 'estorno_producao' && m.reversedMovementId === productionId,
        )
        if (alreadyReversed)
          return { success: false, error: 'Esta produção já foi estornada.' }

        const ts = Date.now()
        const updatedMaterials = [...materials]
        const newMovements: StockMovement[] = []

        for (const pm of productionMovements) {
          const matIndex = updatedMaterials.findIndex((m) => m.id === pm.materialId)
          if (matIndex === -1) continue
          const mat = updatedMaterials[matIndex]
          const nextStock = Math.round((mat.stockQuantity + pm.quantity) * 1000) / 1000
          updatedMaterials[matIndex] = { ...mat, stockQuantity: nextStock, updatedAt: ts }
          newMovements.push({
            id: uid(),
            materialId: pm.materialId,
            type: 'estorno_producao',
            quantity: pm.quantity,
            note: `Estorno da produção ${productionId.slice(0, 6)}`,
            reversedMovementId: productionId,
            createdAt: ts,
          })
        }

        set((state) => ({
          materials: updatedMaterials,
          movements: [...newMovements, ...state.movements],
        }))

        return { success: true }
      },
    }),
    {
      name: 'bakeryflow-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        categories: state.categories,
        products: state.products,
        materials: state.materials,
        movements: state.movements,
        sales: state.sales,
        lastQuantities: state.lastQuantities,
        lastSaleWarnings: state.lastSaleWarnings,
      }),
    },
  ),
)

// Selectors
export const selectTotalItems = (s: StoreState) =>
  s.cart.reduce((sum, i) => sum + i.quantity, 0)
export const selectTotalPrice = (s: StoreState) =>
  s.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
