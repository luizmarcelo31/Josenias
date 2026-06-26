'use client'

import { BarChart3, Package, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tab = 'pdv' | 'financeiro' | 'estoque'

const tabs: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'pdv', label: 'PDV', icon: ShoppingCart },
  { id: 'financeiro', label: 'Financeiro', icon: BarChart3 },
  { id: 'estoque', label: 'Estoque', icon: Package },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-16 max-w-lg items-stretch border-t border-border bg-card"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-95"
          >
            {isActive && (
              <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />
            )}
            <Icon
              className={cn(
                'h-6 w-6 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <span
              className={cn(
                'text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
