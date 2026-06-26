'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type Category,
} from '@/lib/types'
import { useStore } from '@/lib/store'

export function CategoryFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Category | null
}) {
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0].value)
  const [icon, setIcon] = useState(CATEGORY_ICONS[0])
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setDescription(editing?.description ?? '')
      setColor(editing?.color ?? CATEGORY_COLORS[0].value)
      setIcon(editing?.icon ?? CATEGORY_ICONS[0])
      setError('')
    }
  }, [open, editing])

  function handleSave() {
    const trimmed = name.trim()
    if (trimmed.length < 3) {
      setError('O nome precisa ter ao menos 3 caracteres.')
      return
    }
    const duplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editing?.id,
    )
    if (duplicate) {
      setError('Já existe uma categoria com esse nome.')
      return
    }
    if (editing) {
      updateCategory(editing.id, { name: trimmed, description, color, icon })
      toast.success('Categoria atualizada')
    } else {
      addCategory({ name: trimmed, description, color, icon })
      toast.success('Categoria criada')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar Categoria' : 'Nova Categoria'}
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
        {/* Preview */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${color}20` }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {name || 'Nome da categoria'}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {description || 'Descrição opcional'}
            </p>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label
            htmlFor="cat-name"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Nome <span className="text-danger">*</span>
          </label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Ex.: Pães"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label
            htmlFor="cat-desc"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Descrição
          </label>
          <input
            id="cat-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        {/* Cor */}
        <div>
          <span className="mb-2 block text-sm font-medium text-foreground">
            Cor
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.name}
                aria-pressed={color === c.value}
                className={`h-9 w-9 rounded-full transition-transform active:scale-90 ${
                  color === c.value
                    ? 'ring-2 ring-offset-2 ring-offset-card'
                    : ''
                }`}
                style={{
                  backgroundColor: c.value,
                  // @ts-expect-error css var
                  '--tw-ring-color': c.value,
                }}
              />
            ))}
          </div>
        </div>

        {/* Ícone */}
        <div>
          <span className="mb-2 block text-sm font-medium text-foreground">
            Ícone
          </span>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                aria-label={`Ícone ${ic}`}
                aria-pressed={icon === ic}
                className={`flex h-11 items-center justify-center rounded-lg border text-xl transition-transform active:scale-90 ${
                  icon === ic
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
