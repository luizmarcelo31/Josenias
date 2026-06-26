'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ProductsScreen } from '@/components/products-screen'
import { CategoriesScreen } from '@/components/categories-screen'

type Segment = 'produtos' | 'categorias'

export function ManagementHub({ onBack }: { onBack: () => void }) {
  const [segment, setSegment] = useState<Segment>('produtos')

  return (
    <div>
      <div className="sticky top-[57px] z-10 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Gestão</h1>
        </div>
        <div className="flex rounded-xl bg-secondary p-1">
          {(['produtos', 'categorias'] as Segment[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSegment(s)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
                segment === s
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {segment === 'produtos' ? <ProductsScreen /> : <CategoriesScreen />}
    </div>
  )
}
