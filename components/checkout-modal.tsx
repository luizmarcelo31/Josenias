'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronLeft, CreditCard } from 'lucide-react'
import { formatBRL, type PaymentMethod } from '@/lib/types'
import { selectTotalPrice, useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'
import { Drawer } from 'vaul'

type Step = 'select' | 'dinheiro' | 'cartao' | 'done'

export function CheckoutModal() {
  const isOpen = useStore((s) => s.isCheckoutOpen)
  const closeCheckout = useStore((s) => s.closeCheckout)
  const completeSale = useStore((s) => s.completeSale)
  const total = useStore(selectTotalPrice)
  const [step, setStep] = useState<Step>('select')
  const [receivedString, setReceivedString] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setStep('select')
      setReceivedString('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const received = Number.parseFloat(receivedString) || 0
  const change = received - total

  function pay(method: PaymentMethod) {
    vibrate(20)
    setStep('done')
    setTimeout(() => {
      completeSale(method)
    }, 700)
  }

  function handleNumberClick(num: string) {
    vibrate(10)
    if (num === 'back') {
      setReceivedString((prev) => prev.slice(0, -1))
    } else {
      setReceivedString((prev) => prev + num)
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(o) => { if (!o) closeCheckout() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm" onClick={closeCheckout} />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[96vh] w-full max-w-sm flex-col rounded-t-[24px] bg-card outline-none sm:bottom-4 sm:rounded-[24px]">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          
          <div className="p-6 text-center">
            <Drawer.Title className="sr-only">Checkout</Drawer.Title>

            {step === 'done' && (
              <div className="flex flex-col items-center py-6">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground animate-in zoom-in">
                  <Check className="h-8 w-8" />
                </span>
                <p className="mt-4 text-lg font-bold text-foreground">
                  Venda concluída!
                </p>
              </div>
            )}

            {step === 'select' && (
              <>
                <p className="mb-2 text-muted-foreground">Total a receber</p>
                <p className="mb-8 text-5xl font-bold text-foreground tabular-nums">
                  {formatBRL(total)}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('dinheiro')}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-lg font-bold transition-transform active:scale-95"
                  >
                    <span className="text-2xl" aria-hidden>💵</span> Dinheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('cartao')}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-lg font-bold transition-transform active:scale-95"
                  >
                    <span className="text-2xl" aria-hidden>💳</span> Cartão
                  </button>
                  <button
                    type="button"
                    onClick={() => pay('pix')}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border-2 bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 text-lg font-bold transition-transform active:scale-95"
                  >
                    <span className="text-2xl" aria-hidden>🟢</span> Pix
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeCheckout}
                  className="mt-6 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
              </>
            )}

            {step === 'cartao' && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep('select')} className="rounded-full p-2 bg-secondary text-foreground hover:bg-border">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-xl font-bold">Tipo de Cartão</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => pay('cartao_credito')}
                    className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-bold transition-transform active:scale-95"
                  >
                    <CreditCard className="h-6 w-6" /> Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => pay('cartao_debito')}
                    className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold transition-transform active:scale-95"
                  >
                    <CreditCard className="h-6 w-6" /> Débito
                  </button>
                </div>
              </div>
            )}

            {step === 'dinheiro' && (
              <div className="animate-in fade-in slide-in-from-right-4 text-left">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep('select')} className="rounded-full p-2 bg-secondary text-foreground hover:bg-border">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-xl font-bold">Pagamento em Dinheiro</h3>
                </div>

                <div className="mb-4 rounded-xl bg-secondary/50 p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Total da Venda</span>
                    <span className="font-bold">{formatBRL(total)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Valor Recebido</span>
                    <span className="font-bold text-emerald-600">{formatBRL(received)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">Troco</span>
                    <span className={`text-lg font-bold ${change >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {change >= 0 ? formatBRL(change) : 'Falta dinheiro'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNumberClick(key)}
                      className="flex h-12 items-center justify-center rounded-xl bg-secondary text-xl font-semibold text-foreground transition-transform active:scale-90"
                    >
                      {key === 'back' ? '⌫' : key}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => pay('dinheiro')}
                  disabled={change < 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span aria-hidden>💵</span> Confirmar Venda
                </button>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
