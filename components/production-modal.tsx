'use client'

import { useState, useMemo } from 'react'
import { Drawer } from 'vaul'
import { ChefHat, AlertTriangle, CheckCircle, XCircle, Minus, Plus } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

interface ProductionModalProps {
  product: Product | null
  onClose: () => void
}

export function ProductionModal({ product, onClose }: ProductionModalProps) {
  const [quantity, setQuantity] = useState(1)
  const materials = useStore((s) => s.materials)
  const produceProduct = useStore((s) => s.produceProduct)

  const isOpen = !!product

  function handleClose() {
    setQuantity(1)
    onClose()
  }

  // Compute ingredient breakdown in real-time
  const ingredientLines = useMemo(() => {
    if (!product?.recipe) return []
    return product.recipe
      .map((ri) => {
        const mat = materials.find((m) => m.id === ri.materialId)
        if (!mat) return null
        const needed = Math.round(ri.quantity * quantity * 1000) / 1000
        const afterDeduction = Math.round((mat.stockQuantity - needed) * 1000) / 1000
        const status: 'ok' | 'low' | 'critical' =
          afterDeduction < 0
            ? 'critical'
            : afterDeduction < mat.minStockQuantity
            ? 'low'
            : 'ok'
        return { mat, needed, afterDeduction, status }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [product, quantity, materials])

  const hasErrors = ingredientLines.some((l) => l.status === 'critical')
  const hasWarnings = ingredientLines.some((l) => l.status === 'low')

  function handleProduce() {
    if (!product) return
    const result = produceProduct(product.id, quantity)
    if (!result.success) {
      toast.error(result.errors[0] ?? 'Erro ao produzir.')
      return
    }
    if (result.warnings.length > 0) {
      toast.warning(`Produção registrada! Atenção: ${result.warnings[0]}`, {
        duration: 5000,
      })
    } else {
      toast.success(`${quantity}x ${product.name} fabricado(s)! Insumos deduzidos.`, {
        style: { background: '#F0FAF6', border: '1px solid #1D9E75', color: '#0F6E56' },
      })
    }
    handleClose()
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-sm flex-col bg-white outline-none"
          style={{ borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' }}
        >
          {/* Handle */}
          <div
            style={{
              width: 36, height: 4, background: '#E2E8E5',
              borderRadius: 2, margin: '10px auto 0', flexShrink: 0,
            }}
          />

          <div className="flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-4 pb-3 shrink-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0FAF6]">
                  <ChefHat className="h-5 w-5 text-[#1D9E75]" />
                </div>
                <div>
                  <Drawer.Title className="text-lg font-bold text-foreground leading-tight">
                    Registrar Produção
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {product?.name}
                  </Drawer.Description>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-2">

              {/* Quantity picker */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Quantidade a Produzir
                </p>
                <div className="flex items-center gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors active:bg-border disabled:opacity-40"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v > 0) setQuantity(v)
                    }}
                    className="w-20 rounded-xl border border-border bg-white py-2.5 text-center text-2xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition-colors active:bg-border"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Ingredient breakdown */}
              {ingredientLines.length > 0 ? (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Consumo de Insumos
                  </p>
                  <div className="flex flex-col gap-2">
                    {ingredientLines.map(({ mat, needed, afterDeduction, status }) => {
                      const bg =
                        status === 'critical'
                          ? 'bg-red-50 border-red-200'
                          : status === 'low'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-[#F0FAF6] border-[#C5E8D8]'
                      const textColor =
                        status === 'critical'
                          ? 'text-red-700'
                          : status === 'low'
                          ? 'text-amber-700'
                          : 'text-[#0F6E56]'
                      const Icon =
                        status === 'critical'
                          ? XCircle
                          : status === 'low'
                          ? AlertTriangle
                          : CheckCircle

                      return (
                        <div
                          key={mat.id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${bg}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 shrink-0 ${textColor}`} />
                            <span className="text-sm font-semibold text-foreground">{mat.name}</span>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold tabular-nums ${textColor}`}>
                              −{needed} {mat.unit}
                            </p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              Resta: {afterDeduction < 0 ? '0' : afterDeduction} {mat.unit}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-dashed border-border bg-secondary/50 py-6 text-center text-sm text-muted-foreground">
                  Nenhum insumo vinculado na ficha técnica.
                </div>
              )}

              {/* Warning / error banners */}
              {hasErrors && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Estoque insuficiente para completar a produção. Ajuste a quantidade ou reabasteça os insumos.</span>
                </div>
              )}
              {!hasErrors && hasWarnings && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Alguns insumos ficarão abaixo do estoque mínimo. A produção ainda pode ser confirmada.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-8 pt-3 shrink-0 border-t border-border">
              <button
                type="button"
                onClick={handleProduce}
                disabled={hasErrors || ingredientLines.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-[#1D9E75] py-4 text-[15px] font-bold text-white shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChefHat className="h-5 w-5" />
                Confirmar Produção de {quantity} {product?.name}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
