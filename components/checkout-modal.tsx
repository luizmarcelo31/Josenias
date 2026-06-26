'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, CreditCard } from 'lucide-react'
import { formatBRL, type PaymentMethod } from '@/lib/types'
import { selectTotalPrice, useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'

function vibratePattern(pattern: number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}
import { Drawer } from 'vaul'

type Step = 'select' | 'dinheiro' | 'cartao' | 'done'

// ── Dó-Mi-Sol arpeggio check sound ──────────
function playCheckSound() {
  if (typeof window === 'undefined') return
  try {
    const ctx = new AudioContext()
    const play = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset)
      // Envelope: attack 5ms, sustain, release last 30ms
      gain.gain.setValueAtTime(0, ctx.currentTime + startOffset)
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startOffset + 0.005)
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startOffset + duration - 0.03)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startOffset + duration)
      osc.start(ctx.currentTime + startOffset)
      osc.stop(ctx.currentTime + startOffset + duration)
    }
    play(523, 0,    0.08)   // Dó
    play(659, 0.06, 0.10)   // Mi
    play(784, 0.13, 0.15)   // Sol
    setTimeout(() => ctx.close(), 600)
  } catch {
    // Web Audio not available
  }
}

export function CheckoutModal() {
  const isOpen = useStore((s) => s.isCheckoutOpen)
  const closeCheckout = useStore((s) => s.closeCheckout)
  const completeSale = useStore((s) => s.completeSale)
  const lastSaleWarnings = useStore((s) => s.lastSaleWarnings)
  const total = useStore(selectTotalPrice)
  const [step, setStep] = useState<Step>('select')
  const [receivedString, setReceivedString] = useState('')
  const [saleTime, setSaleTime] = useState('')

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
    vibratePattern([40, 20, 80])
    playCheckSound()
    setSaleTime(
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    )
    setStep('done')
    setTimeout(() => {
      completeSale(method)
    }, 1800)
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
    <Drawer.Root open={isOpen} onOpenChange={(o: boolean) => { if (!o) closeCheckout() }}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-50 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={closeCheckout}
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[96vh] w-full max-w-sm flex-col outline-none"
          style={{
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 32px rgba(29,158,117,0.12)',
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: 36, height: 4, background: '#D1D5DB',
              borderRadius: 2, margin: '10px auto 0', flexShrink: 0,
            }}
          />

          <Drawer.Title className="sr-only">Checkout</Drawer.Title>

          <div className="flex flex-col px-6 pb-8 pt-4">

            {/* ── Done ── */}
            {step === 'done' && (
              <div className="flex flex-col items-center py-6">
                {/* Icon */}
                <div
                  className="success-fadein flex items-center justify-center rounded-full"
                  style={{ width: 56, height: 56, background: '#E1F5EE', fontSize: 26 }}
                  aria-hidden
                >
                  ✅
                </div>

                <p
                  className="mt-3"
                  style={{ fontSize: 17, fontWeight: 700, color: '#1A2620' }}
                >
                  Venda registrada
                </p>
                <p style={{ fontSize: 13, color: '#9EB5AD', marginTop: 2 }}>
                  {saleTime}
                </p>
                <p
                  className="tabular-nums"
                  style={{ fontSize: 32, fontWeight: 800, color: '#1D9E75', margin: '12px 0' }}
                >
                  {formatBRL(total)}
                </p>

                {lastSaleWarnings && lastSaleWarnings.length > 0 && (
                  <div 
                    className="w-full mb-4 rounded-xl border p-3.5 text-left text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1.5" style={{ color: '#B45309' }}>
                      <span>⚠️</span> Estoque de Insumos Insuficiente
                    </div>
                    <ul className="list-disc pl-4 space-y-1">
                      {lastSaleWarnings.map((warning, idx) => (
                        <li key={idx} className="font-medium">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={closeCheckout}
                  className="w-full flex items-center justify-center rounded-[12px] transition-all active:scale-[0.97]"
                  style={{
                    height: 50, background: '#1D9E75', color: '#fff',
                    fontSize: 16, fontWeight: 700,
                  }}
                >
                  Nova venda
                </button>
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="w-full mt-2 transition-colors"
                  style={{ fontSize: 13, color: '#9EB5AD', fontWeight: 500, paddingTop: 8 }}
                >
                  Ver no financeiro
                </button>
              </div>
            )}

            {/* ── Select method ── */}
            {step === 'select' && (
              <>
                <p
                  className="mb-1 text-center"
                  style={{ fontSize: 13, color: '#9EB5AD' }}
                >
                  Total a receber
                </p>
                <p
                  className="mb-7 text-center tabular-nums"
                  style={{ fontSize: 44, fontWeight: 800, color: '#1A2620' }}
                >
                  {formatBRL(total)}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('dinheiro')}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border-2 text-lg font-bold transition-transform active:scale-95"
                    style={{ background: '#F0FAF6', borderColor: '#A7DFC9', color: '#0F6E56' }}
                  >
                    <span aria-hidden className="text-2xl">💵</span> Dinheiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('cartao')}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border-2 text-lg font-bold transition-transform active:scale-95"
                    style={{ background: '#F0FAF6', borderColor: '#A7DFC9', color: '#0F6E56' }}
                  >
                    <span aria-hidden className="text-2xl">💳</span> Cartão
                  </button>
                  <button
                    type="button"
                    onClick={() => pay('pix')}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border-2 text-lg font-bold transition-transform active:scale-95"
                    style={{ background: '#F0FAF6', borderColor: '#A7DFC9', color: '#0F6E56' }}
                  >
                    <span aria-hidden className="text-2xl">🟢</span> Pix
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeCheckout}
                  className="mt-5 text-sm font-semibold transition-colors"
                  style={{ color: '#9EB5AD' }}
                >
                  Cancelar
                </button>
              </>
            )}

            {/* ── Cartão ── */}
            {step === 'cartao' && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="rounded-full p-2 transition-colors"
                    style={{ background: '#F0FAF6', color: '#1A2620' }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-xl font-bold" style={{ color: '#1A2620' }}>Tipo de Cartão</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => pay('cartao_credito')}
                    className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 font-bold transition-transform active:scale-95"
                    style={{ background: '#F0FAF6', borderColor: '#A7DFC9', color: '#0F6E56' }}
                  >
                    <CreditCard className="h-6 w-6" /> Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => pay('cartao_debito')}
                    className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 font-bold transition-transform active:scale-95"
                    style={{ background: '#F0FAF6', borderColor: '#A7DFC9', color: '#0F6E56' }}
                  >
                    <CreditCard className="h-6 w-6" /> Débito
                  </button>
                </div>
              </div>
            )}

            {/* ── Dinheiro ── */}
            {step === 'dinheiro' && (
              <div className="animate-in fade-in slide-in-from-right-4 text-left">
                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="rounded-full p-2 transition-colors"
                    style={{ background: '#F0FAF6', color: '#1A2620' }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-xl font-bold" style={{ color: '#1A2620' }}>
                    Pagamento em Dinheiro
                  </h3>
                </div>

                <div
                  className="mb-4 rounded-xl p-4"
                  style={{ background: '#FAFCFB', border: '0.5px solid #E8EFEC' }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm" style={{ color: '#9EB5AD' }}>Total da Venda</span>
                    <span className="font-bold" style={{ color: '#1A2620' }}>{formatBRL(total)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm" style={{ color: '#9EB5AD' }}>Valor Recebido</span>
                    <span className="font-bold" style={{ color: '#1D9E75' }}>{formatBRL(received)}</span>
                  </div>
                  <div
                    className="flex justify-between items-center mt-3 pt-3"
                    style={{ borderTop: '0.5px solid #E2E8E5' }}
                  >
                    <span className="text-sm font-semibold" style={{ color: '#1A2620' }}>Troco</span>
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ color: change >= 0 ? '#1D9E75' : '#DC2626' }}
                    >
                      {change >= 0 ? formatBRL(change) : 'Falta dinheiro'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNumberClick(key)}
                      className="flex h-12 items-center justify-center rounded-xl text-xl font-semibold transition-transform active:scale-90"
                      style={{ background: '#FAFCFB', border: '0.5px solid #E8EFEC', color: '#1A2620' }}
                    >
                      {key === 'back' ? '⌫' : key}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => pay('dinheiro')}
                  disabled={change < 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  style={{ background: '#1D9E75', color: '#fff' }}
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
