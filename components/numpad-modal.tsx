'use client'

import { useEffect } from 'react'
import { Delete, X } from 'lucide-react'
import { formatBRL } from '@/lib/types'
import { useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { Drawer } from 'vaul'

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back']

export function NumpadModal() {
  const product = useStore((s) => s.numpadProduct)
  const value = useStore((s) => s.numpadValue)
  const closeNumpad = useStore((s) => s.closeNumpad)
  const appendNumpad = useStore((s) => s.appendNumpad)
  const deleteNumpad = useStore((s) => s.deleteNumpad)
  const clearNumpad = useStore((s) => s.clearNumpad)
  const confirmNumpad = useStore((s) => s.confirmNumpad)

  const qty = Number.parseInt(value, 10) || 0
  const subtotal = product ? product.salePrice * qty : 0

  // Keyboard support
  useEffect(() => {
    if (!product) return

    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        appendNumpad(e.key)
      } else if (e.key === 'Backspace') {
        deleteNumpad()
      } else if (e.key === 'Enter') {
        if (qty > 0) {
          vibrate(10)
          confirmNumpad()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [product, qty, appendNumpad, deleteNumpad, confirmNumpad])

  if (!product) return null

  function press(key: string) {
    vibrate(10)
    if (key === 'C') clearNumpad()
    else if (key === 'back') deleteNumpad()
    else appendNumpad(key)
  }

  return (
    <Drawer.Root open={!!product} onOpenChange={(o) => { if (!o) closeNumpad() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={closeNumpad} />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[96vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[24px] bg-card outline-none shadow-xl sm:bottom-4 sm:rounded-[24px]">
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <Drawer.Title className="sr-only">Quantidade</Drawer.Title>
          <div className="flex flex-col">
            {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <p className="text-lg font-bold text-foreground">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatBRL(product.salePrice)} / {product.unit}
            </p>
          </div>
          <button
            type="button"
            onClick={closeNumpad}
            aria-label="Fechar"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Display */}
        <div className="flex flex-col items-center bg-secondary p-6">
          <p className="mb-1 text-sm text-muted-foreground">Quantidade</p>
          <p className="text-6xl font-bold tabular-nums text-foreground">
            {qty}
          </p>
          <p className="mt-2 text-lg font-semibold text-primary">
            {formatBRL(subtotal)}
          </p>
        </div>

        {/* Teclado */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {keys.map((key) => {
            if (key === 'C') {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => press(key)}
                  aria-label="Limpar"
                  className="flex h-16 items-center justify-center rounded-xl bg-red-50 text-2xl font-semibold text-destructive transition-transform hover:bg-red-100 active:scale-95"
                >
                  C
                </button>
              )
            }
            if (key === 'back') {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => press(key)}
                  aria-label="Apagar"
                  className="flex h-16 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-transform hover:bg-border active:scale-95"
                >
                  <Delete className="h-6 w-6" />
                </button>
              )
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                className="flex h-16 items-center justify-center rounded-xl border border-border bg-card text-2xl font-semibold text-foreground shadow-sm transition-transform hover:bg-secondary active:scale-95"
              >
                {key}
              </button>
            )
          })}
        </div>

        {/* Confirmar */}
        <div className="p-4 pt-0">
          <button
            type="button"
            disabled={qty <= 0}
            onClick={() => {
              vibrate(10)
              confirmNumpad()
            }}
            className={cn(
              'flex h-14 w-full items-center justify-center rounded-xl text-lg font-bold transition-transform active:scale-[0.98]',
              qty > 0
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90'
                : 'bg-border text-muted-foreground shadow-none',
            )}
          >
            Adicionar ({qty})
          </button>
        </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
