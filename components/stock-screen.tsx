'use client'

import { useMemo } from 'react'
import { formatBRL, mockProducts } from '@/lib/products'
import { useStore } from '@/lib/store'

export function StockScreen() {
  const sales = useStore((s) => s.sales)

  const soldByProduct = useMemo(() => {
    const map: Record<string, number> = {}
    for (const sale of sales) {
      for (const item of sale.items) {
        map[item.id] = (map[item.id] ?? 0) + item.quantity
      }
    }
    return map
  }, [sales])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="px-1 text-2xl font-bold text-foreground">Estoque</h1>

      <div className="flex flex-col gap-2">
        {mockProducts.map((p) => {
          const sold = soldByProduct[p.id] ?? 0
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
                <span aria-hidden>{p.emoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {p.name}
                </p>
                <p className="text-sm text-muted-foreground">{p.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary tabular-nums">
                  {formatBRL(p.price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sold} vendidos
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
