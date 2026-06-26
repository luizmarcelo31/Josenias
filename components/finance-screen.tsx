'use client'

import { TrendingUp, Receipt, Wallet } from 'lucide-react'
import { formatBRL, type PaymentMethod } from '@/lib/types'
import { useStore } from '@/lib/store'

const methodLabel: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'Pix',
}

const methodEmoji: Record<PaymentMethod, string> = {
  dinheiro: '💵',
  cartao: '💳',
  pix: '🟢',
}

export function FinanceScreen() {
  const sales = useStore((s) => s.sales)

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalSales = sales.length
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="px-1 text-2xl font-bold text-foreground">Financeiro</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-5 w-5 text-success" />
            <span className="text-sm font-medium">Faturamento do dia</span>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {formatBRL(totalRevenue)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Vendas</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {totalSales}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Ticket médio</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {formatBRL(avgTicket)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
          Últimas vendas
        </h2>
        {sales.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Nenhuma venda registrada ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <span className="text-2xl" aria-hidden>
                  {methodEmoji[sale.method]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {methodLabel[sale.method]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sale.items.reduce((s, i) => s + i.quantity, 0)} itens ·{' '}
                    {new Date(sale.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="font-bold text-foreground tabular-nums">
                  {formatBRL(sale.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
