'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'
import {
  formatBRL,
  getMargin,
  type MovementType,
  type Product,
} from '@/lib/types'
import { useStore } from '@/lib/store'

const inputCls =
  'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20'
const labelCls = 'mb-1.5 block text-sm font-medium text-foreground'

export function PriceEditModal({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const updateProduct = useStore((s) => s.updateProduct)
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (product) setPrice(String(product.salePrice))
  }, [product])

  const newPrice = Number.parseFloat(price) || 0
  const margin = product ? getMargin(product.costPrice, newPrice) : 0

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Alterar Preço"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!product || newPrice <= 0) return
              updateProduct(product.id, { salePrice: newPrice })
              toast.success('Preço atualizado')
              onClose()
            }}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 hover:bg-primary/90"
          >
            Salvar
          </button>
        </>
      }
    >
      {product && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
            <span className="text-2xl">{product.emoji}</span>
            <div>
              <p className="font-semibold text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                Atual: {formatBRL(product.salePrice)}
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="new-price" className={labelCls}>
              Novo preço (R$)
            </label>
            <input
              id="new-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              autoFocus
              className={inputCls}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
            <span className="text-sm font-medium text-muted-foreground">
              Nova margem
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                margin >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}

const movementTypes: { value: MovementType; label: string }[] = [
  { value: 'entrada_compra', label: 'Entrada' },
  { value: 'perda', label: 'Saída / Perda' },
  { value: 'ajuste', label: 'Ajuste' },
]

const lossReasons = ['vencimento', 'quebra', 'qualidade', 'roubo', 'outro']

export function StockAdjustModal({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const adjustStock = useStore((s) => s.adjustStock)
  const [type, setType] = useState<MovementType>('entrada_compra')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('vencimento')
  const [observation, setObservation] = useState('')

  useEffect(() => {
    if (product) {
      setType('entrada_compra')
      setQuantity('')
      setReason('vencimento')
      setObservation('')
    }
  }, [product])

  const qty = Number.parseInt(quantity, 10) || 0

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Ajustar Estoque"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!product || qty <= 0) return
              const finalReason = type === 'perda' ? reason : type
              adjustStock(product.id, type, qty, finalReason, observation)
              toast.success('Estoque ajustado')
              onClose()
            }}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 hover:bg-primary/90"
          >
            Salvar
          </button>
        </>
      }
    >
      {product && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
            <span className="text-2xl">{product.emoji}</span>
            <div>
              <p className="font-semibold text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                Estoque atual: {product.stockQuantity} {product.unit}
              </p>
            </div>
          </div>

          <div>
            <span className={labelCls}>Tipo de movimento</span>
            <div className="grid grid-cols-3 gap-2">
              {movementTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                    type === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="adj-qty" className={labelCls}>
              {type === 'ajuste' ? 'Quantidade final' : 'Quantidade'}
            </label>
            <input
              id="adj-qty"
              type="number"
              inputMode="numeric"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
              className={inputCls}
            />
          </div>

          {type === 'perda' && (
            <div>
              <label htmlFor="adj-reason" className={labelCls}>
                Motivo
              </label>
              <select
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`${inputCls} capitalize`}
              >
                {lossReasons.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="adj-obs" className={labelCls}>
              Observação
            </label>
            <input
              id="adj-obs"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Opcional"
              className={inputCls}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
