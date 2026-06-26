'use client'

import { useMemo, useState } from 'react'
import {
  Boxes,
  DollarSign,
  PackagePlus,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductFormModal } from '@/components/product-form-modal'
import { PriceEditModal, StockAdjustModal } from '@/components/quick-edit-modals'
import { ConfirmDialog } from '@/components/modal'
import {
  STOCK_STATUS_META,
  formatBRL,
  getMargin,
  getStockStatus,
  type Product,
} from '@/lib/types'
import { useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'
import { useAutoAnimate } from '@formkit/auto-animate/react'

export function ProductsScreen() {
  const [listRef] = useAutoAnimate()
  const products = useStore((s) => s.products)
  const categories = useStore((s) => s.categories)
  const deleteProduct = useStore((s) => s.deleteProduct)
  const toggleProductActive = useStore((s) => s.toggleProductActive)

  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [priceProduct, setPriceProduct] = useState<Product | null>(null)
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const categoryMap = useMemo(() => {
    const map: Record<string, (typeof categories)[number]> = {}
    for (const c of categories) map[c.id] = c
    return map
  }, [categories])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (catFilter !== 'all' && p.categoryId !== catFilter) return false
      if (q && !p.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, query, catFilter])

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto..."
          aria-label="Buscar produto"
          className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Filtro por categoria */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip
          label="Todas"
          active={catFilter === 'all'}
          onClick={() => setCatFilter('all')}
        />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            label={`${c.icon} ${c.name}`}
            active={catFilter === c.id}
            onClick={() => setCatFilter(c.id)}
          />
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Boxes className="h-14 w-14 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">Nenhum produto</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {query || catFilter !== 'all'
              ? 'Nenhum produto corresponde ao filtro.'
              : 'Cadastre seu primeiro produto.'}
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <PackagePlus className="h-4 w-4" /> Novo Produto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2" ref={listRef}>
          {filtered.map((p) => {
            const cat = categoryMap[p.categoryId]
            const status = getStockStatus(p)
            const meta = STOCK_STATUS_META[status]
            const margin = getMargin(p.costPrice, p.salePrice)
            return (
              <div
                key={p.id}
                className={`rounded-xl border border-border bg-card p-3 shadow-card transition-opacity ${
                  p.isActive ? '' : 'opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl overflow-hidden">
                    {p.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      p.emoji
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-foreground">
                        {p.name}
                      </p>
                      {!p.isActive && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {cat && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          {cat.name}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.color}`}
                      >
                        {p.stockQuantity} {p.unit} · {meta.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary tabular-nums">
                      {formatBRL(p.salePrice)}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {margin.toFixed(0)}% margem
                    </p>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5">
                  <ActionButton
                    icon={DollarSign}
                    label="Preço"
                    onClick={() => setPriceProduct(p)}
                  />
                  <ActionButton
                    icon={Boxes}
                    label="Estoque"
                    onClick={() => setStockProduct(p)}
                  />
                  <ActionButton
                    icon={Pencil}
                    label="Editar"
                    onClick={() => {
                      setEditing(p)
                      setFormOpen(true)
                    }}
                  />
                  <ActionButton
                    icon={Power}
                    label={p.isActive ? 'Desativar' : 'Ativar'}
                    onClick={() => {
                      vibrate(10)
                      toggleProductActive(p.id)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(10)
                      setToDelete(p)
                    }}
                    aria-label={`Excluir ${p.name}`}
                    className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      {filtered.length > 0 && (
        <button
          type="button"
          onClick={openNew}
          aria-label="Novo produto"
          className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-90"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
      <PriceEditModal
        product={priceProduct}
        onClose={() => setPriceProduct(null)}
      />
      <StockAdjustModal
        product={stockProduct}
        onClose={() => setStockProduct(null)}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          deleteProduct(toDelete.id)
          toast.success('Produto excluído')
        }}
        title="Excluir produto"
        message={`Tem certeza que deseja excluir "${toDelete?.name}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof DollarSign
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
