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
  type RecipeItem,
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
  const materials = useStore((s) => s.materials)
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

  const [recipe, setRecipe] = useState<RecipeItem[]>([])
  const [recipeOpen, setRecipeOpen] = useState(false)
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [materialQty, setMaterialQty] = useState('')

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
      setRecipe(editing?.recipe ?? [])
      setRecipeOpen(!!(editing?.recipe && editing.recipe.length > 0))
      setSelectedMaterialId(materials[0]?.id ?? '')
      setMaterialQty('')
      setError('')
    }
  }, [open, editing, categories, materials])

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
      stockQuantity: 0,
      minStockQuantity: 0,
      unit,
      sku: sku.trim(),
      emoji,
      imageUrl,
      isFrequent,
      isActive,
      recipe: recipe.filter(r => materials.some(m => m.id === r.materialId)),
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

  const recipeCost = recipe.reduce((sum, item) => {
    const mat = materials.find((m) => m.id === item.materialId)
    return sum + (mat ? item.quantity * mat.costPrice : 0)
  }, 0)

  function handleAddIngredient() {
    if (!selectedMaterialId) return
    const qty = parseFloat(materialQty)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida')
      return
    }
    if (recipe.some((r) => r.materialId === selectedMaterialId)) {
      toast.error('Este insumo já está na ficha')
      return
    }
    const newIngredient: RecipeItem = {
      materialId: selectedMaterialId,
      quantity: qty,
    }
    setRecipe([...recipe, newIngredient])
    setMaterialQty('')
  }

  function handleRemoveIngredient(materialId: string) {
    setRecipe(recipe.filter((r) => r.materialId !== materialId))
  }

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

        {/* Unidade */}
        <div>
          <label htmlFor="prod-unit" className={labelCls}>
            Unidade de venda <span className="text-danger">*</span>
          </label>
          <select
            id="prod-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className={inputCls}
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.value === 'un' ? 'Unidade (un)' : u.value === 'kg' ? 'Quilo (kg)' : 'Litro (L)'}
              </option>
            ))}
          </select>
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

        {/* Ficha Técnica Collapsible */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setRecipeOpen(!recipeOpen)}
            className="flex w-full items-center justify-between px-3.5 py-3 text-sm font-semibold text-foreground hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              📝 Ficha Técnica (Opcional)
            </span>
            <span className="text-xs text-muted-foreground font-bold">
              {recipeOpen ? '▲ Fechar' : '▼ Abrir'}
            </span>
          </button>
          
          {recipeOpen && (
            <div className="border-t border-border p-3.5 flex flex-col gap-3.5 bg-slate-50/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Defina os insumos consumidos por cada 1 unidade ou kg deste produto vendido. O estoque desses insumos será deduzido automaticamente.
              </p>

              {materials.length === 0 ? (
                <p className="text-xs text-warning font-medium py-1">
                  Nenhum insumo cadastrado. Cadastre insumos na aba Estoque primeiro.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                      <label htmlFor="recipe-mat" className="mb-1 block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Insumo
                      </label>
                      <select
                        id="recipe-mat"
                        value={selectedMaterialId}
                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                        className={inputCls}
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 shrink-0">
                      <label htmlFor="recipe-qty" className="mb-1 block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Qtd ({materials.find(m => m.id === selectedMaterialId)?.unit || ''})
                      </label>
                      <input
                        id="recipe-qty"
                        type="number"
                        inputMode="decimal"
                        min="0.001"
                        step="0.001"
                        placeholder="0.00"
                        value={materialQty}
                        onChange={(e) => setMaterialQty(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95 hover:bg-primary/95"
                    >
                      Incluir
                    </button>
                  </div>

                  {recipe.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3 max-h-48 overflow-y-auto no-scrollbar">
                      {recipe.map((item) => {
                        const mat = materials.find((m) => m.id === item.materialId)
                        if (!mat) return null
                        return (
                          <div
                            key={item.materialId}
                            className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm text-sm"
                          >
                            <span className="font-semibold text-foreground">{mat.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary tabular-nums">
                                {item.quantity} {mat.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(item.materialId)}
                                className="rounded-full hover:bg-red-50 text-muted-foreground hover:text-danger p-1 transition-colors"
                                title="Remover"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between rounded-xl bg-secondary px-3.5 py-3 text-sm">
                    <span className="font-medium text-muted-foreground">Custo estimado de insumos:</span>
                    <span className="font-extrabold text-foreground tabular-nums">
                      {formatBRL(recipeCost)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
