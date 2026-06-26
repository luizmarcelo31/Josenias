'use client'

import React, { useState, useMemo } from 'react'
import { Drawer } from 'vaul'
import { Check, Info, PackageMinus, PackagePlus, Search, Plus, AlertTriangle, CalendarClock, Edit2, Trash2, ChefHat, RotateCcw, History } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { MovementType, Material, MaterialUnit, StockMovement } from '@/lib/types'
import { toast } from 'sonner'
import { getMaterialStockStatus, STOCK_STATUS_META } from '@/lib/types'

function getDaysUntil(dateStr?: string) {
  if (!dateStr) return Infinity
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'pct', label: 'Pacote (pct)' },
]

export function StockScreen() {
  const materials = useStore((s) => s.materials)
  const addMaterial = useStore((s) => s.addMaterial)
  const updateMaterial = useStore((s) => s.updateMaterial)
  const deleteMaterial = useStore((s) => s.deleteMaterial)
  const movements = useStore((s) => s.movements)
  const adjustMaterialStock = useStore((s) => s.adjustMaterialStock)
  const reverseProduction = useStore((s) => s.reverseProduction)
  
  const [tab, setTab] = useState<'insumos' | 'historico'>('insumos')
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'expiring'>('all')

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [movementType, setMovementType] = useState<MovementType>('entrada')
  const [adjustQuantity, setAdjustQuantity] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Material>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [costInput, setCostInput] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [minStockInput, setMinStockInput] = useState('')

  const criticalMaterials = materials.filter(m => m.stockQuantity <= m.minStockQuantity)
  const expiringMaterials = materials.filter(m => getDaysUntil(m.expirationDate) <= 7)

  let filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  if (filterMode === 'critical') {
    filteredMaterials = filteredMaterials.filter(m => m.stockQuantity <= m.minStockQuantity)
  } else if (filterMode === 'expiring') {
    filteredMaterials = filteredMaterials.filter(m => getDaysUntil(m.expirationDate) <= 7)
  }

  function handleOpenAdjust(material: Material) {
    setSelectedMaterial(material)
    setMovementType('entrada')
    setAdjustQuantity('')
    setAdjustNote('')
    setIsAdjustOpen(true)
  }

  function handleConfirmAdjust() {
    const qty = Number.parseFloat(adjustQuantity)
    if (!selectedMaterial || Number.isNaN(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida')
      return
    }

    adjustMaterialStock(selectedMaterial.id, movementType, qty, adjustNote)
    setIsAdjustOpen(false)
    toast.success('Estoque atualizado com sucesso', {
      style: { background: '#F0FAF6', border: '1px solid #1D9E75', color: '#0F6E56' },
    })
  }

  function handleOpenForm(material?: Material) {
    if (material) {
      setFormData(material)
      setCostInput(String(material.costPrice))
      setStockInput(String(material.stockQuantity))
      setMinStockInput(String(material.minStockQuantity))
      setIsEditing(true)
    } else {
      setFormData({ unit: 'un' })
      setCostInput('0')
      setStockInput('0')
      setMinStockInput('0')
      setIsEditing(false)
    }
    setIsFormOpen(true)
  }

  function handleSaveForm() {
    const parsedCost = parseFloat(costInput)
    const parsedStock = parseFloat(stockInput)
    const parsedMin = parseFloat(minStockInput)

    if (isNaN(parsedCost) || isNaN(parsedStock) || isNaN(parsedMin)) {
      toast.error('Informe valores numéricos válidos')
      return
    }

    if (!formData.name || !formData.unit) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const payload = {
      ...formData,
      costPrice: parsedCost,
      stockQuantity: parsedStock,
      minStockQuantity: parsedMin,
    }
    
    if (isEditing && formData.id) {
      updateMaterial(formData.id, payload as Material)
      toast.success('Insumo atualizado')
    } else {
      addMaterial(payload as Omit<Material, 'id'|'createdAt'|'updatedAt'>)
      toast.success('Insumo criado')
    }
    setIsFormOpen(false)
  }

  function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
      deleteMaterial(id)
      toast.success('Insumo excluído')
    }
  }

  // Groups for production history
  const productionGroups = useMemo(() => {
    const groups: Record<string, StockMovement[]> = {}
    for (const m of movements) {
      if (m.type !== 'producao') continue
      const key = m.productionId ?? m.id
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    }
    // Also include estornos linked to a producao
    return Object.entries(groups)
      .map(([prodId, mvs]) => {
        const snapshot = mvs[0]?.productionSnapshot
        const reversed = movements.some(
          (m) => m.type === 'estorno_producao' && m.reversedMovementId === prodId,
        )
        const canReverse = !reversed && Date.now() - (mvs[0]?.createdAt ?? 0) < 30 * 60 * 1000
        return { prodId, mvs, snapshot, reversed, canReverse }
      })
      .sort((a, b) => (b.mvs[0]?.createdAt ?? 0) - (a.mvs[0]?.createdAt ?? 0))
  }, [movements])

  const allHistory = useMemo(() => {
    return [...movements].sort((a, b) => b.createdAt - a.createdAt)
  }, [movements])

  function handleReverseProduction(prodId: string) {
    if (!confirm('Tem certeza que deseja estornar esta produção? Os insumos serão restaurados.')) return
    const result = reverseProduction(prodId)
    if (result.success) {
      toast.success('Produção estornada! Insumos restaurados.', {
        style: { background: '#F0FAF6', border: '1px solid #1D9E75', color: '#0F6E56' },
      })
    } else {
      toast.error(result.error ?? 'Erro ao estornar produção.')
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24 h-[calc(100vh-80px)] overflow-hidden bg-background">
      <div className="flex items-center justify-between px-0.5">
        <h1 className="text-xl font-bold text-foreground">Estoque</h1>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" /> Novo Insumo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-[12px] shrink-0">
        <button
          onClick={() => setTab('insumos')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-bold transition-colors ${
            tab === 'insumos' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PackagePlus className="h-4 w-4" /> Insumos
        </button>
        <button
          onClick={() => setTab('historico')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm font-bold transition-colors ${
            tab === 'historico' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" /> Histórico
        </button>
      </div>

      {tab === 'insumos' ? (
        <>
          {(criticalMaterials.length > 0 || expiringMaterials.length > 0) && (
            <div className="flex flex-col gap-2 shrink-0">
              {criticalMaterials.length > 0 && (
                <button 
                  onClick={() => setFilterMode(filterMode === 'critical' ? 'all' : 'critical')}
                  className={`flex items-center gap-2 rounded-lg p-3 text-left transition-colors border ${filterMode === 'critical' ? 'bg-[#FFF0F0] border-red-200' : 'bg-red-50/50 border-transparent hover:bg-red-50'}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-800 text-sm">Estoque Baixo</p>
                    <p className="text-xs text-red-600 truncate">{criticalMaterials.length} insumo(s) abaixo do limite mínimo</p>
                  </div>
                </button>
              )}
              
              {expiringMaterials.length > 0 && (
                <button 
                  onClick={() => setFilterMode(filterMode === 'expiring' ? 'all' : 'expiring')}
                  className={`flex items-center gap-2 rounded-lg p-3 text-left transition-colors border ${filterMode === 'expiring' ? 'bg-[#FFFBEB] border-amber-200' : 'bg-amber-50/50 border-transparent hover:bg-amber-50'}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-800 text-sm">Vencendo em breve</p>
                    <p className="text-xs text-amber-600 truncate">{expiringMaterials.length} insumo(s) vencem em menos de 7 dias</p>
                  </div>
                </button>
              )}
            </div>
          )}

          <div className="relative shrink-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              placeholder="Buscar insumos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-[12px] border-0 bg-white py-3 pl-10 pr-4 text-sm text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary"
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
            {materials.length === 0 ? (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                <p className="mb-4">Você ainda não tem insumos cadastrados.</p>
                <button
                  onClick={() => handleOpenForm()}
                  className="text-primary font-bold underline"
                >
                  Cadastre seu primeiro insumo
                </button>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Nenhum insumo encontrado.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredMaterials.map((m) => {
                  const status = getMaterialStockStatus(m)
                  const meta = STOCK_STATUS_META[status]
                  const days = getDaysUntil(m.expirationDate)
                  const percent = Math.min(100, Math.max(0, (m.stockQuantity / (m.minStockQuantity * 2 || 1)) * 100))
                  
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-border bg-white p-3 shadow-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-bold text-foreground text-base">
                              {m.name}
                            </p>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {m.stockQuantity} {m.unit} &middot; {formatCurrency(m.costPrice)}/{m.unit}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleOpenAdjust(m)}
                            className="rounded bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary active:bg-primary/20"
                          >
                            Ajustar
                          </button>
                          <button
                            onClick={() => handleOpenForm(m)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-secondary active:bg-secondary/80"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>Estoque</span>
                          <span>Mín: {m.minStockQuantity}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div 
                            className={`h-full transition-all ${status === 'ok' ? 'bg-primary' : status === 'baixo' ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap mt-1">
                        {status !== 'ok' && (
                          <span className="inline-flex items-center rounded-sm bg-[#FFF0F0] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#DC2626] ring-1 ring-inset ring-red-100">
                            ⚠ Baixo
                          </span>
                        )}
                        {days <= 7 && (
                          <span className="inline-flex items-center rounded-sm bg-[#FFFBEB] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#D97706] ring-1 ring-inset ring-amber-100">
                            📅 Vence em {days} dias
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* HISTÓRICO DE MOVIMENTAÇÕES */
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {allHistory.length === 0 ? (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {allHistory.map((mv) => {
                const mat = materials.find((m) => m.id === mv.materialId)
                const isProducao = mv.type === 'producao'
                const isEstorno = mv.type === 'estorno_producao'
                const canReverse =
                  isProducao &&
                  mv.productionId &&
                  !movements.some(
                    (m) => m.type === 'estorno_producao' && m.reversedMovementId === mv.productionId,
                  ) &&
                  Date.now() - mv.createdAt < 30 * 60 * 1000

                const typeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
                  entrada: { label: 'Entrada', color: 'text-[#1D9E75]', bg: 'bg-[#F0FAF6]', icon: <PackagePlus className="h-3.5 w-3.5" /> },
                  saida: { label: 'Saída', color: 'text-blue-600', bg: 'bg-blue-50', icon: <PackageMinus className="h-3.5 w-3.5" /> },
                  perda: { label: 'Perda', color: 'text-red-600', bg: 'bg-red-50', icon: <Info className="h-3.5 w-3.5" /> },
                  producao: { label: 'Produção', color: 'text-[#0F6E56]', bg: 'bg-[#E8F7F2]', icon: <ChefHat className="h-3.5 w-3.5" /> },
                  estorno_producao: { label: 'Estorno', color: 'text-amber-700', bg: 'bg-amber-50', icon: <RotateCcw className="h-3.5 w-3.5" /> },
                }
                const cfg = typeConfig[mv.type] ?? typeConfig.saida
                const dt = new Date(mv.createdAt)
                const dateStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                return (
                  <div
                    key={mv.id}
                    className="rounded-[14px] border-[0.5px] border-border bg-white p-3 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {mat?.name ?? 'Insumo removido'}
                          </p>
                          {mv.note && (
                            <p className="text-xs text-muted-foreground truncate">{mv.note}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-0.5">{dateStr} às {timeStr}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <p className={`text-sm font-bold tabular-nums ${cfg.color}`}>
                          {isEstorno ? '+' : (mv.type === 'entrada' ? '+' : '−')}{mv.quantity} {mat?.unit ?? ''}
                        </p>
                        {canReverse && mv.productionId && (
                          <button
                            onClick={() => handleReverseProduction(mv.productionId!)}
                            className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-700 active:bg-amber-100 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" /> Estornar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE AJUSTE */}
      <Drawer.Root open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-sm flex-col bg-white outline-none"
            style={{ borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.1)' }}
          >
            <div
              style={{
                width: 36, height: 4, background: '#E2E8E5',
                borderRadius: 2, margin: '10px auto 0', flexShrink: 0,
              }}
            />
            
            <div className="px-6 pb-8 pt-4">
              <Drawer.Title className="text-xl font-bold text-foreground mb-1">
                Ajustar Estoque
              </Drawer.Title>
              <Drawer.Description className="text-sm text-muted-foreground mb-6">
                {selectedMaterial?.name} ({selectedMaterial?.stockQuantity} {selectedMaterial?.unit} disponíveis)
              </Drawer.Description>

              <div className="flex flex-col gap-5">
                <div className="flex gap-2 p-1 bg-secondary rounded-[12px]">
                  <button
                    onClick={() => setMovementType('entrada')}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[10px] text-xs font-bold transition-colors ${
                      movementType === 'entrada'
                        ? 'bg-white text-success shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PackagePlus className="w-5 h-5 mb-1" /> Entrada
                  </button>
                  <button
                    onClick={() => setMovementType('saida')}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[10px] text-xs font-bold transition-colors ${
                      movementType === 'saida'
                        ? 'bg-white text-[#2563EB] shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <PackageMinus className="w-5 h-5 mb-1" /> Saída
                  </button>
                  <button
                    onClick={() => setMovementType('perda')}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[10px] text-xs font-bold transition-colors ${
                      movementType === 'perda'
                        ? 'bg-white text-destructive shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Info className="w-5 h-5 mb-1" /> Perda
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                    Quantidade ({selectedMaterial?.unit})
                  </label>
                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                    className="block w-full rounded-[12px] border-0 bg-secondary py-4 px-4 text-xl font-bold text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Motivo ou nota..."
                    className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                  />
                </div>

                <button
                  onClick={handleConfirmAdjust}
                  className={`mt-2 flex items-center justify-center gap-2 rounded-[12px] py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98] ${
                    movementType === 'entrada' ? 'bg-primary' : movementType === 'saida' ? 'bg-[#2563EB]' : 'bg-destructive'
                  }`}
                >
                  <Check className="h-5 w-5" /> Confirmar {movementType === 'entrada' ? 'Entrada' : movementType === 'saida' ? 'Saída' : 'Perda'}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* MODAL NOVO/EDITAR INSUMO */}
      <Drawer.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[95vh] w-full max-w-sm flex-col bg-white outline-none"
            style={{ borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.1)' }}
          >
            <div
              style={{
                width: 36, height: 4, background: '#E2E8E5',
                borderRadius: 2, margin: '10px auto 0', flexShrink: 0,
              }}
            />
            
            <div className="px-6 pb-8 pt-4 overflow-y-auto no-scrollbar">
              <Drawer.Title className="text-xl font-bold text-foreground mb-4">
                {isEditing ? 'Editar Insumo' : 'Novo Insumo'}
              </Drawer.Title>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                    Nome do Insumo
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Farinha de Trigo"
                    className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                      Unidade
                    </label>
                    <select
                      value={formData.unit || 'un'}
                      onChange={(e) => setFormData({...formData, unit: e.target.value as MaterialUnit})}
                      className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors appearance-none"
                    >
                      {UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                      Custo (R$)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                      Qtd. Atual
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                      Qtd. Mínima
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={minStockInput}
                      onChange={(e) => setMinStockInput(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                    Fornecedor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.supplier || ''}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Nome do fornecedor"
                    className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                    Vencimento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate || ''}
                    onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                    className="block w-full rounded-[12px] border-0 bg-secondary py-3 px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white transition-colors"
                  />
                </div>

                <button
                  onClick={handleSaveForm}
                  className="mt-4 flex items-center justify-center gap-2 rounded-[12px] bg-primary py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
                >
                  <Check className="h-5 w-5" /> {isEditing ? 'Salvar Alterações' : 'Criar Insumo'}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
