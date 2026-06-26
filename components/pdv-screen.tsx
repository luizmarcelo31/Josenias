'use client'

import { useMemo, useState } from 'react'
import { Search, ShoppingCart } from 'lucide-react'
import { formatBRL, type Product } from '@/lib/types'
import { selectTotalItems, selectTotalPrice, useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'
import { useAutoAnimate } from '@formkit/auto-animate/react'

export function PdvScreen() {
  const [gridRef] = useAutoAnimate()
  const [chipsRef] = useAutoAnimate()
  
  const [query, setQuery] = useState('')
  const products = useStore((s) => s.products)
  const openNumpad = useStore((s) => s.openNumpad)
  const openCart = useStore((s) => s.openCart)
  const totalItems = useStore(selectTotalItems)
  const totalPrice = useStore(selectTotalPrice)

  const active = useMemo(
    () => products.filter((p) => p.isActive),
    [products],
  )

  const frequent = useMemo(
    () => active.filter((p) => p.isFrequent),
    [active],
  )

  const filtered = useMemo(() => {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const q = normalize(query.trim())
    if (!q) return active
    return active.filter((p) => normalize(p.name).includes(q))
  }, [query, active])

  function handleSelect(product: Product) {
    vibrate(10)
    openNumpad(product)
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {/* Busca */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto..."
          aria-label="Buscar produto"
          className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Chips frequentes */}
      {!query && frequent.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
            Mais vendidos
          </h2>
          <div ref={chipsRef} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {frequent.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card transition-all hover:border-primary/40 active:scale-95"
              >
                <span className="text-base leading-none">{p.emoji}</span>
                <span>{p.name}</span>
                <span className="font-semibold text-primary">
                  {formatBRL(p.salePrice)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de produtos */}
      <div>
        <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
          {query ? 'Resultados' : 'Todos os produtos'}
        </h2>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado.
          </p>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 gap-3">
            {filtered.map((p) => {
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex flex-col rounded-xl border border-border bg-card p-3 text-left shadow-card transition-transform active:scale-[0.98] active:bg-secondary"
                >
                  <div className="relative mb-2 flex aspect-square items-center justify-center rounded-lg bg-secondary text-5xl overflow-hidden">
                    {p.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden>{p.emoji}</span>
                    )}
                  </div>
                  <span className="truncate text-sm font-semibold text-foreground">
                    {p.name}
                  </span>
                  <span className="mt-1 text-base font-bold text-primary tabular-nums">
                    {formatBRL(p.salePrice)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Barra do carrinho (fixa) */}
      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-lg px-4 pb-3">
          <button
            type="button"
            onClick={() => {
              vibrate(10)
              openCart()
            }}
            className="flex w-full items-center justify-between rounded-xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98] animate-in slide-in-from-bottom-4 fade-in"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </span>
            <span className="text-xl font-bold tabular-nums">
              {formatBRL(totalPrice)}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
