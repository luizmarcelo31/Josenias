'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { formatBRL, type PaymentMethod, type Sale } from '@/lib/types'
import { useStore } from '@/lib/store'

const methodLabel: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
  pix: 'Pix',
}

const methodEmoji: Record<PaymentMethod, string> = {
  dinheiro: '💵',
  cartao: '💳',
  cartao_credito: '💳',
  cartao_debito: '💳',
  pix: '🟢',
}

// ── Section label ─────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="uppercase tracking-wider"
      style={{ fontSize: 11, fontWeight: 600, color: '#9EB5AD', letterSpacing: '0.06em' }}
    >
      {children}
    </p>
  )
}

// ── PDF generation ────────────────────────────
async function generatePDF(
  sales: Sale[],
  totalRevenue: number,
  totalSales: number,
  avgTicket: number,
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 16

  // ── Header ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(26, 38, 32)
  doc.text('Panificadora Cauã', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(92, 114, 104)
  doc.text('Relatório de Vendas', margin, y)

  doc.setFontSize(9)
  doc.setTextColor(158, 181, 173)
  doc.text(`Gerado em ${dateStr} às ${timeStr}`, pageW - margin, y - 4, { align: 'right' })
  y += 6

  doc.setDrawColor(226, 232, 229)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── Resumo do Dia ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(158, 181, 173)
  doc.text('RESUMO DO DIA', margin, y)
  y += 5

  const resumeLines: [string, string, boolean][] = [
    ['Total de vendas', String(totalSales), false],
    ['Ticket médio', formatBRL(avgTicket), false],
    ['Forma de pagamento', 'Misto', false],
    ['Faturamento total', formatBRL(totalRevenue), true],
  ]

  for (const [label, value, bold] of resumeLines) {
    if (bold) {
      // highlight row
      doc.setFillColor(240, 250, 246)
      doc.roundedRect(margin, y - 3.5, pageW - margin * 2, 7, 1, 1, 'F')
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(10)
    doc.setTextColor(bold ? 26 : 92, bold ? 38 : 114, bold ? 32 : 104)
    doc.text(label, margin + 2, y + 0.5)
    doc.setTextColor(26, 38, 32)
    doc.text(value, pageW - margin - 2, y + 0.5, { align: 'right' })
    y += 7
  }
  y += 4

  // ── Produtos vendidos ──
  doc.setDrawColor(226, 232, 229)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(158, 181, 173)
  doc.text('PRODUTOS VENDIDOS', margin, y)
  y += 5

  // Aggregate items
  const itemMap = new Map<string, { name: string; qty: number; unit: number; sub: number }>()
  for (const sale of sales) {
    for (const item of sale.items) {
      const existing = itemMap.get(item.productId)
      if (existing) {
        existing.qty += item.quantity
        existing.sub += item.subtotal
      } else {
        itemMap.set(item.productId, {
          name: item.name,
          qty: item.quantity,
          unit: item.unitPrice,
          sub: item.subtotal,
        })
      }
    }
  }

  const items = [...itemMap.values()]

  // Table header
  const cols = [margin + 2, margin + 76, margin + 100, margin + 128]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(92, 114, 104)
  doc.text('Produto', cols[0], y)
  doc.text('Qtd', cols[1], y, { align: 'right' })
  doc.text('Unitário', cols[2], y, { align: 'right' })
  doc.text('Subtotal', cols[3], y, { align: 'right' })
  y += 4
  doc.setDrawColor(226, 232, 229)
  doc.line(margin, y, pageW - margin, y)
  y += 4

  let totalSub = 0
  items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 252, 251)
      doc.rect(margin, y - 3, pageW - margin * 2, 6, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(26, 38, 32)
    doc.text(item.name.slice(0, 30), cols[0], y)
    doc.text(String(item.qty), cols[1], y, { align: 'right' })
    doc.text(formatBRL(item.unit), cols[2], y, { align: 'right' })
    doc.text(formatBRL(item.sub), cols[3], y, { align: 'right' })
    totalSub += item.sub
    y += 6
  })

  // Total row
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(240, 250, 246)
  doc.roundedRect(margin, y - 3, pageW - margin * 2, 7, 1, 1, 'F')
  doc.setTextColor(29, 158, 117)
  doc.text('TOTAL', cols[0], y + 0.5)
  doc.text(formatBRL(totalSub), cols[3], y + 0.5, { align: 'right' })
  y += 10

  // ── Histórico de vendas ──
  if (y > 230) { doc.addPage(); y = 16 }

  doc.setDrawColor(226, 232, 229)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(158, 181, 173)
  doc.text('HISTÓRICO DE VENDAS', margin, y)
  y += 5

  const ordered = [...sales].sort((a, b) => b.createdAt - a.createdAt)
  let saleNumber = ordered.length
  
  for (const sale of ordered) {
    if (y > 270) { doc.addPage(); y = 16 }
    const t = new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const method = methodLabel[sale.method]
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(26, 38, 32)
    doc.text(`Venda #${saleNumber.toString().padStart(2, '0')}`, margin + 2, y)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(92, 114, 104)
    doc.text(`${t} · ${method}`, pageW - margin - 2, y, { align: 'right' })
    y += 5
    
    for (const item of sale.items) {
      if (y > 275) { doc.addPage(); y = 16 }
      doc.setFontSize(8)
      doc.setTextColor(26, 38, 32)
      doc.text(`${item.quantity}x ${item.name}`, margin + 4, y)
      y += 4
    }
    
    if (y > 275) { doc.addPage(); y = 16 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(29, 158, 117)
    doc.text(`Total: ${formatBRL(sale.total)}`, margin + 4, y)
    y += 8
    
    saleNumber--
  }

  // ── Footer ──
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(158, 181, 173)
    doc.text('Gerado por Panificadora Cauã', margin, 288)
    doc.text(`Página ${i} / ${pageCount}`, pageW - margin, 288, { align: 'right' })
  }

  const fileName = `Relatorio-${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}.pdf`
  doc.save(fileName)
}

// ── Main Component ─────────────────────────────
export function FinanceScreen() {
  const sales = useStore((s) => s.sales)
  const setSales = useStore((s) => s.clearSales)

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalSales = sales.length
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  const handleZerar = useCallback(() => {
    const ok = window.confirm(
      'Tem certeza? Esta ação apaga todas as vendas do dia e não pode ser desfeita.',
    )
    if (!ok) return
    setSales()
    toast.success('Vendas zeradas', {
      style: { background: '#F0FAF6', border: '1px solid #1D9E75', color: '#0F6E56' },
    })
  }, [setSales])

  const handleExportPDF = useCallback(async () => {
    if (sales.length === 0) {
      toast.error('Nenhuma venda para exportar.')
      return
    }
    await generatePDF(sales, totalRevenue, totalSales, avgTicket)
  }, [sales, totalRevenue, totalSales, avgTicket])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <h1 className="px-0.5 text-xl font-bold" style={{ color: '#1A2620' }}>
        Financeiro
      </h1>

      {/* ── Faturamento do dia ── */}
      <div
        className="flex flex-col gap-4 rounded-[14px] bg-white p-4"
        style={{ border: '0.5px solid #E2E8E5' }}
      >
        <div className="flex items-center gap-1.5">
          <span aria-hidden>📈</span>
          <SectionLabel>Faturamento do dia</SectionLabel>
        </div>
        <p
          className="tabular-nums"
          style={{ fontSize: 28, fontWeight: 800, color: '#1A2620', lineHeight: 1 }}
        >
          {formatBRL(totalRevenue)}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Vendas */}
          <div
            className="flex flex-col gap-1 rounded-[10px] p-3"
            style={{ background: '#FAFCFB', border: '0.5px solid #E8EFEC' }}
          >
            <p style={{ fontSize: 10, fontWeight: 500, color: '#9EB5AD' }}>Vendas</p>
            <p className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: '#1A2620' }}>
              {totalSales}
            </p>
          </div>
          {/* Ticket médio */}
          <div
            className="flex flex-col gap-1 rounded-[10px] p-3"
            style={{ background: '#FAFCFB', border: '0.5px solid #E8EFEC' }}
          >
            <p style={{ fontSize: 10, fontWeight: 500, color: '#9EB5AD' }}>Ticket médio</p>
            <p className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: '#1A2620' }}>
              {formatBRL(avgTicket)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Exportar PDF ── */}
      <button
        type="button"
        onClick={handleExportPDF}
        className="flex items-center gap-2 rounded-[10px] bg-white px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]"
        style={{ border: '1px solid #E2E8E5', color: '#1A2620' }}
        aria-label="Exportar relatório PDF"
      >
        <span aria-hidden>📄</span>
        Exportar relatório PDF
      </button>

      {/* ── Últimas vendas ── */}
      <div
        className="flex flex-col rounded-[14px] bg-white overflow-hidden"
        style={{ border: '0.5px solid #E2E8E5' }}
      >
        <div className="flex items-center gap-1.5 px-4 pt-4 pb-3">
          <SectionLabel>Últimas vendas</SectionLabel>
        </div>

        {sales.length === 0 ? (
          <p className="px-4 pb-6 text-center text-sm" style={{ color: '#9EB5AD' }}>
            Nenhuma venda registrada ainda.
          </p>
        ) : (
          <ul>
            {sales.map((sale, idx) => {
              const isRecent = idx < 2
              return (
                <li
                  key={sale.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderTop: idx > 0 ? '0.5px solid #F0F4F2' : undefined,
                  }}
                >
                  {/* Dot */}
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: isRecent ? '#1D9E75' : '#E2E8E5',
                    }}
                  />
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-medium leading-tight"
                      style={{ fontSize: 13, color: isRecent ? '#1A2620' : '#9EB5AD' }}
                    >
                      {methodEmoji[sale.method]} {methodLabel[sale.method]}
                    </p>
                    <p
                      style={{ fontSize: 11, color: '#9EB5AD' }}
                    >
                      {sale.items.reduce((s, i) => s + i.quantity, 0)} itens ·{' '}
                      {new Date(sale.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {/* Value */}
                  <span
                    className="tabular-nums"
                    style={{ fontSize: 14, fontWeight: 700, color: '#1A2620' }}
                  >
                    {formatBRL(sale.total)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Zerar vendas ── */}
      <button
        type="button"
        onClick={handleZerar}
        className="w-full rounded-[10px] py-3 text-sm font-semibold transition-all active:scale-[0.98]"
        style={{
          background: 'transparent',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: 14,
          fontWeight: 600,
        }}
        aria-label="Zerar vendas do dia"
      >
        Zerar vendas do dia
      </button>
    </div>
  )
}
