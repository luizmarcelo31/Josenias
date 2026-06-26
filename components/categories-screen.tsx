'use client'

import { useMemo, useState } from 'react'
import { FolderPlus, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CategoryFormModal } from '@/components/category-form-modal'
import { ConfirmDialog } from '@/components/modal'
import type { Category } from '@/lib/types'
import { useStore } from '@/lib/store'
import { vibrate } from '@/lib/haptics'
import { useAutoAnimate } from '@formkit/auto-animate/react'

export function CategoriesScreen() {
  const [listRef] = useAutoAnimate()
  const categories = useStore((s) => s.categories)
  const products = useStore((s) => s.products)
  const deleteCategory = useStore((s) => s.deleteCategory)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of products) {
      map[p.categoryId] = (map[p.categoryId] ?? 0) + 1
    }
    return map
  }, [products])

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-4" ref={listRef}>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Tags className="h-14 w-14 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">Nenhuma categoria</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Crie categorias para organizar seus produtos.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <FolderPlus className="h-4 w-4" /> Nova Categoria
          </button>
        </div>
      ) : (
        categories.map((c) => {
          const count = countByCategory[c.id] ?? 0
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
              style={{ borderLeft: `4px solid ${c.color}` }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${c.color}20` }}
              >
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {c.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {c.description || 'Sem descrição'}
                </p>
                <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {count} {count === 1 ? 'produto' : 'produtos'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  aria-label={`Editar ${c.name}`}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrate(10)
                    setToDelete(c)
                  }}
                  aria-label={`Excluir ${c.name}`}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })
      )}

      {/* FAB */}
      {categories.length > 0 && (
        <button
          type="button"
          onClick={openNew}
          aria-label="Nova categoria"
          className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-90"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          deleteCategory(toDelete.id)
          const count = countByCategory[toDelete.id] ?? 0
          toast.success(
            count > 0
              ? `Categoria e ${count} produto(s) excluídos`
              : 'Categoria excluída',
          )
        }}
        title="Excluir categoria"
        message={
          toDelete && (countByCategory[toDelete.id] ?? 0) > 0
            ? `"${toDelete.name}" possui ${countByCategory[toDelete.id]} produto(s). Excluir a categoria também removerá esses produtos. Deseja continuar?`
            : `Tem certeza que deseja excluir "${toDelete?.name}"?`
        }
        confirmLabel="Excluir"
        danger
      />
    </div>
  )
}
