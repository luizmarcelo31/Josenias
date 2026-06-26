'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Trash2 } from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { Modal } from '@/components/modal'
import {
  CATEGORY_ICONS,
  UNITS,
  formatBRL,
  getMargin,
  type Product,
  type Unit,
} from '@/lib/types'
import { useStore } from '@/lib/store'

export function ProductFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Product | null
}) {
  const categories = useStore((s) => s.categories)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [cost, setCost] = useState('')
  const [sale, setSale] = useState('')
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState('')
  const [unit, setUnit] = useState<Unit>('un')
  const [sku, setSku] = useState('')
  const [emoji, setEmoji] = useState(CATEGORY_ICONS[0])
  const [isFrequent, setIsFrequent] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setCategoryId(editing?.categoryId ?? categories[0]?.id ?? '')
      setCost(editing ? String(editing.costPrice) : '')
      setSale(editing ? String(editing.salePrice) : '')
      setStock(editing ? String(editing.stockQuantity) : '0')
      setMinStock(editing ? String(editing.minStockQuantity) : '0')
      setUnit(editing?.unit ?? 'un')
      setSku(editing?.sku ?? '')
      setEmoji(editing?.emoji ?? CATEGORY_ICONS[0])
      setImageUrl(editing?.imageUrl)
      setIsFrequent(editing?.isFrequent ?? false)
      setIsActive(editing?.isActive ?? true)
      setError('')
    }
  }, [open, editing, categories])

  const costNum = Number.parseFloat(cost) || 0
  const saleNum = Number.parseFloat(sale) || 0
  const margin = getMargin(costNum, saleNum)

  function handleSave() {
    if (name.trim().length < 2) {
      setError('Informe o nome do produto.')
      return
    }
    if (!categoryId) {
      setError('Selecione uma categoria.')
      return
    }
    if (saleNum <= 0) {
      setError('O preço de venda deve ser maior que zero.')
      return
    }
    const data = {
      name: name.trim(),
      categoryId,
      costPrice: costNum,
      salePrice: saleNum,
      stockQuantity: Number.parseInt(stock, 10) || 0,
      minStockQuantity: Number.parseInt(minStock, 10) || 0,
      unit,
      sku: sku.trim(),
      emoji,
      imageUrl,
      isFrequent,
      isActive,
    }
    if (editing) {
      updateProduct(editing.id, data)
      toast.success('Produto atualizado')
    } else {
      addProduct(data)
      toast.success('Produto criado')
    }
    onClose()
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20'
  const labelCls = 'mb-1.5 block text-sm font-medium text-foreground'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar Produto' : 'Novo Produto'}
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
            onClick={handleSave}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95 hover:bg-primary/90"
          >
            Salvar
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Nome */}
        <div>
          <label htmlFor="prod-name" className={labelCls}>
            Nome <span className="text-danger">*</span>
          </label>
          <input
            id="prod-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Ex.: Pão Francês"
            className={inputCls}
          />
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="prod-cat" className={labelCls}>
            Categoria <span className="text-danger">*</span>
          </label>
          <select
            id="prod-cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            {categories.length === 0 && <option value="">Crie uma categoria</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custo e Venda */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prod-cost" className={labelCls}>
              Custo (R$)
            </label>
            <input
              id="prod-cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0,00"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="prod-sale" className={labelCls}>
              Venda (R$) <span className="text-danger">*</span>
            </label>
            <input
              id="prod-sale"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={sale}
              onChange={(e) => {
                setSale(e.target.value)
                setError('')
              }}
              placeholder="0,00"
              className={inputCls}
            />
          </div>
        </div>

        {/* Margem */}
        <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">
            Margem de lucro
          </span>
          <span
            className={`text-sm font-bold tabular-nums ${
              margin >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {margin.toFixed(1)}% · {formatBRL(saleNum - costNum)}
          </span>
        </div>

        {/* Estoque */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="prod-stock" className={labelCls}>
              Estoque
            </label>
            <input
              id="prod-stock"
              type="number"
              inputMode="numeric"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="prod-min" className={labelCls}>
              Mínimo
            </label>
            <input
              id="prod-min"
              type="number"
              inputMode="numeric"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="prod-unit" className={labelCls}>
              Unidade
            </label>
            <select
              id="prod-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className={inputCls}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="prod-sku" className={labelCls}>
            SKU / Código de barras
          </label>
          <input
            id="prod-sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Opcional"
            className={inputCls}
          />
        </div>

        {/* Imagem / Ícone */}
        <div>
          <span className={labelCls}>Foto ou Ícone</span>
          
          <div className="mb-3 flex items-center gap-3">
            {imageUrl ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Produto" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="absolute right-1 top-1 rounded-full bg-danger/90 p-1 text-white shadow backdrop-blur transition-transform active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/50 text-3xl">
                {emoji}
              </div>
            )}
            
            <div className="flex flex-1 flex-col gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold transition-colors hover:bg-secondary active:scale-95">
                <Camera className="h-4 w-4" />
                Adicionar Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      try {
                        const compressed = await compressImage(file)
                        setImageUrl(compressed)
                      } catch (err) {
                        toast.error('Erro ao processar imagem')
                      }
                    }
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                A foto substitui o ícone de emoji no PDV.
              </p>
            </div>
          </div>

          {!imageUrl && (
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setEmoji(ic)}
                  aria-label={`Ícone ${ic}`}
                  aria-pressed={emoji === ic}
                  className={`flex h-11 items-center justify-center rounded-lg border text-xl transition-transform active:scale-90 ${
                    emoji === ic
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Marcar como frequente"
            description="Aparece nos atalhos do PDV"
            checked={isFrequent}
            onChange={setIsFrequent}
          />
          <ToggleRow
            label="Produto ativo"
            description="Disponível para venda no PDV"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
