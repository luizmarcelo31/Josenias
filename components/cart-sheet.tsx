'use client'

import { useEffect } from 'react'
import { Minus, Plus, Trash2, X } from 'lucide-react'
import { formatBRL } from '@/lib/types'
import { selectTotalPrice, useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'
import { Drawer } from 'vaul'

export function CartSheet() {
  const isOpen = useStore((s) => s.isCartOpen)
  const cart = useStore((s) => s.cart)
  const closeCart = useStore((s) => s.closeCart)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const updateCartQty = useStore((s) => s.updateCartQty)
  const openCheckout = useStore((s) => s.openCheckout)
  const total = useStore(selectTotalPrice)

  return (
    <Drawer.Root open={isOpen} onOpenChange={(o) => { if (!o) closeCart() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={closeCart} />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[96vh] w-full max-w-lg flex-col rounded-t-[24px] bg-card outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <div className="flex-1 overflow-y-auto p-6 pb-8">
            {/* Cabeçalho */}
            <div className="mb-4 flex items-center justify-between">
              <Drawer.Title className="text-xl font-bold text-foreground">Revisar Pedido</Drawer.Title>
              <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de itens */}
        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Seu carrinho está vazio.
          </p>
        ) : (
          <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 rounded-xl bg-secondary p-3"
              >
                <span className="text-2xl" aria-hidden>
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatBRL(item.unitPrice)} ·{' '}
                    {formatBRL(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(10)
                      updateCartQty(item.productId, item.quantity - 1)
                    }}
                    aria-label={`Diminuir ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-foreground transition-transform active:scale-90"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-bold tabular-nums text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={item.quantity >= item.stockQuantity}
                    onClick={() => {
                      vibrate(10)
                      updateCartQty(item.productId, item.quantity + 1)
                    }}
                    aria-label={`Aumentar ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-foreground transition-transform active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    vibrate(10)
                    removeFromCart(item.productId)
                  }}
                  aria-label={`Remover ${item.name}`}
                  className="rounded-full p-1.5 text-destructive transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total
            </span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {formatBRL(total)}
            </span>
          </div>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              vibrate(10)
              openCheckout()
            }}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-success text-lg font-bold text-success-foreground shadow-lg shadow-success/30 transition-transform active:scale-[0.98] disabled:bg-border disabled:text-muted-foreground disabled:shadow-none"
          >
            FINALIZAR E PAGAR
          </button>
        </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
