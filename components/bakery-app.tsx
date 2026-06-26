'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Toaster } from 'sonner'
import { BottomNav, type Tab } from '@/components/bottom-nav'
import { PdvScreen } from '@/components/pdv-screen'
import { FinanceScreen } from '@/components/finance-screen'
import { StockScreen } from '@/components/stock-screen'
import { ManagementHub } from '@/components/management-hub'
import { NumpadModal } from '@/components/numpad-modal'
import { CartSheet } from '@/components/cart-sheet'
import { CheckoutModal } from '@/components/checkout-modal'

export function BakeryApp() {
  const [tab, setTab] = useState<Tab>('pdv')
  const [managing, setManaging] = useState(false)

  return (
    <main className="relative mx-auto min-h-screen max-w-lg bg-background pb-20">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md">
        <span className="text-xl" aria-hidden>
          🥖
        </span>
        <h1 className="text-lg font-bold text-foreground">Panificadora Cauã</h1>
        <button
          type="button"
          onClick={() => setManaging((m) => !m)}
          aria-label="Gestão de produtos e categorias"
          aria-pressed={managing}
          className={`ml-auto rounded-lg p-2 transition-colors ${
            managing
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {managing ? (
        <ManagementHub onBack={() => setManaging(false)} />
      ) : (
        <>
          {tab === 'pdv' && <PdvScreen />}
          {tab === 'financeiro' && <FinanceScreen />}
          {tab === 'estoque' && <StockScreen />}
          <BottomNav active={tab} onChange={setTab} />
        </>
      )}

      <NumpadModal />
      <CartSheet />
      <CheckoutModal />

      <Toaster
        position="top-right"
        richColors
        toastOptions={{ duration: 3000 }}
      />
    </main>
  )
}
