# BakeryFlow — Documentação do Projeto

> PDV e Gestão para Panificadoras — aplicação web PWA mobile-first

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Design System](#design-system)
5. [Arquitetura de Estado (Store)](#arquitetura-de-estado-store)
6. [Tipos e Modelos de Dados](#tipos-e-modelos-de-dados)
7. [Telas e Componentes](#telas-e-componentes)
   - [BakeryApp — Shell da Aplicação](#bakeryapp--shell-da-aplicação)
   - [PDV (Ponto de Venda)](#pdv-ponto-de-venda)
   - [Financeiro](#financeiro)
   - [Estoque](#estoque)
   - [Gestão (Produtos e Categorias)](#gestão-produtos-e-categorias)
8. [Modais e Drawers](#modais-e-drawers)
9. [Fluxo de Produção](#fluxo-de-produção)
10. [Fluxo de Venda (PDV → Checkout)](#fluxo-de-venda-pdv--checkout)
11. [Geração de PDF](#geração-de-pdf)
12. [Persistência de Dados](#persistência-de-dados)
13. [PWA e Service Worker](#pwa-e-service-worker)
14. [Variáveis de Ambiente](#variáveis-de-ambiente)
15. [Scripts e Comandos](#scripts-e-comandos)

---

## Visão Geral

**BakeryFlow** é um sistema de Ponto de Venda (PDV) e gestão operacional desenvolvido para panificadoras. Funciona como um **Progressive Web App (PWA)** instalável no celular, com interface mobile-first otimizada para uso em balcão.

### Funcionalidades principais

| Módulo | Descrição |
|---|---|
| **PDV** | Seleção de produtos, carrinho, checkout com múltiplas formas de pagamento e som de confirmação |
| **Financeiro** | Faturamento do dia, histórico de vendas, relatório em PDF |
| **Estoque** | Cadastro de insumos (materiais), ajuste de estoque, controle de vencimento, histórico de movimentações |
| **Produção** | Registro manual de fabricação de produtos com dedução automática de insumos via ficha técnica |
| **Gestão** | CRUD de produtos e categorias, ficha técnica (receita) por produto |

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 16.2.6 |
| Linguagem | TypeScript | 5.7.3 |
| UI / Estilização | Tailwind CSS v4 | ^4.2.0 |
| Componentes | shadcn/ui + Vaul (Drawers) | — |
| Ícones | lucide-react | ^1.16.0 |
| Estado global | Zustand + persist | ^5.0.14 |
| Persistência local | IndexedDB via idb-keyval | ^6.2.5 |
| Animações de lista | @formkit/auto-animate | ^0.9.0 |
| Toasts | Sonner | ^2.0.7 |
| PDF | jsPDF + @react-pdf/renderer | ^4.2.1 / ^4.5.1 |
| Backend opcional | Supabase | ^2.108.2 |
| PWA / Service Worker | Serwist | ^9.5.11 |
| Analytics | Vercel Analytics | 1.6.1 |

---

## Estrutura de Pastas

```
PDV/
├── app/
│   ├── globals.css          # Variáveis CSS e design tokens globais
│   ├── layout.tsx           # Layout raiz Next.js (metadados, fonte)
│   ├── page.tsx             # Ponto de entrada — renderiza <BakeryApp />
│   └── sw.ts / sw.js/       # Service Worker (PWA)
│
├── components/
│   ├── bakery-app.tsx           # Shell principal — roteamento de abas
│   ├── bottom-nav.tsx           # Navegação inferior (PDV / Financeiro / Estoque)
│   ├── pdv-screen.tsx           # Tela do PDV (grid de produtos)
│   ├── finance-screen.tsx       # Tela Financeiro (KPIs + histórico de vendas + PDF)
│   ├── stock-screen.tsx         # Tela Estoque (insumos + histórico de movimentações)
│   ├── management-hub.tsx       # Hub de Gestão (Produtos / Categorias)
│   ├── products-screen.tsx      # Lista de produtos com CRUD e ação "Fabricar"
│   ├── categories-screen.tsx    # Lista de categorias com CRUD
│   ├── cart-sheet.tsx           # Gaveta lateral do carrinho
│   ├── checkout-modal.tsx       # Modal de finalização de venda
│   ├── numpad-modal.tsx         # Teclado numérico para quantidade
│   ├── production-modal.tsx     # Modal de fabricação de produto (v5)
│   ├── product-form-modal.tsx   # Formulário de criação/edição de produto (+ ficha técnica)
│   ├── category-form-modal.tsx  # Formulário de criação/edição de categoria
│   ├── quick-edit-modals.tsx    # Modal de edição rápida de preço
│   └── modal.tsx                # ConfirmDialog reutilizável
│
├── lib/
│   ├── types.ts         # Todos os tipos TypeScript do domínio
│   ├── store.ts         # Estado global Zustand com persistência IDB
│   ├── seed.ts          # Dados iniciais (categorias e produtos demo)
│   ├── supabase.ts      # Cliente Supabase + tipos do banco
│   ├── haptics.ts       # Vibração háptica (navigator.vibrate)
│   ├── image-utils.ts   # Utilitários de imagem (upload base64)
│   ├── products.ts      # Helpers de produtos
│   └── utils.ts         # cn() — merge de classes Tailwind
│
├── public/              # Assets estáticos (ícones PWA, manifest)
├── package.json
├── tsconfig.json
└── next.config.mjs
```

---

## Design System

### Paleta de Cores

| Token | Valor | Uso |
|---|---|---|
| `--primary` / `#1D9E75` | Verde primário | Botões, destaques, links ativos |
| `#0F6E56` | Verde escuro | Hover, textos sobre fundo claro |
| `#F0FAF6` | Verde claro | Fundos de cards destaque |
| `#FAFCFB` | Verde sutil | Superfícies secundárias |
| `--border` / `#E2E8E5` | Borda esverdeada | Divisores, bordas de inputs |
| `--background` / `#F7F9F7` | Fundo geral | Background da página |
| `--foreground` / `#1A2620` | Texto principal | Títulos e labels |
| `--muted-foreground` / `#5C7268` | Texto secundário | Subtítulos, metadados |
| `#9EB5AD` | Texto muted | Labels de seção, placeholders |

### Tipografia

- **Títulos de seção**: `font-size: 11px`, `font-weight: 600`, `uppercase`, `letter-spacing: 0.06em`, cor `#9EB5AD`
- **Valores monetários**: `font-weight: 800`, classe `tabular-nums`
- **Labels de card**: `font-weight: 500`, cor `#5C7268`

### Componentes de Layout

- **Cards**: `rounded-[14px]`, `border-[0.5px]`, `shadow-card`, `bg-white`
- **Inputs**: `rounded-[12px]`, `bg-secondary`, `ring-1 ring-border`, focus com `ring-primary`
- **Botões primários**: `bg-primary`, `rounded-[14px]`, `font-bold`, `text-white`
- **Drawers (Vaul)**: `border-radius: 20px 20px 0 0`, handle de 36×4px, overlay com `backdrop-blur-sm`

---

## Arquitetura de Estado (Store)

O estado global é gerenciado por **Zustand** com middleware `persist`, que salva automaticamente no **IndexedDB** via `idb-keyval`.

### Chave de persistência

```
bakeryflow-store
```

### Campos persistidos

```ts
{
  categories,       // Categorias de produtos
  products,         // Produtos com ficha técnica (recipe)
  materials,        // Insumos do estoque
  movements,        // Histórico de movimentações de estoque
  sales,            // Histórico de vendas
  lastQuantities,   // Última quantidade usada por produto no PDV
  lastSaleWarnings, // Avisos da última venda (insumos baixos)
}
```

### Ações disponíveis no Store

#### Categorias
| Ação | Descrição |
|---|---|
| `addCategory(data)` | Cria nova categoria |
| `updateCategory(id, data)` | Atualiza categoria existente |
| `deleteCategory(id)` | Exclui categoria e seus produtos |

#### Produtos
| Ação | Descrição |
|---|---|
| `addProduct(data)` | Cria novo produto |
| `updateProduct(id, data)` | Atualiza produto (incluindo `recipe`) |
| `deleteProduct(id)` | Exclui produto |
| `toggleProductActive(id)` | Ativa/desativa produto no PDV |

#### Insumos (Materials)
| Ação | Descrição |
|---|---|
| `addMaterial(data)` | Cria novo insumo |
| `updateMaterial(id, data)` | Atualiza insumo |
| `deleteMaterial(id)` | Exclui insumo |
| `adjustMaterialStock(id, type, qty, note?)` | Lança entrada, saída ou perda manual |

#### Carrinho (Cart)
| Ação | Descrição |
|---|---|
| `addToCart(product, qty)` | Adiciona produto ao carrinho |
| `updateCartQty(productId, qty)` | Atualiza quantidade de item |
| `removeFromCart(productId)` | Remove item do carrinho |
| `clearCart()` | Limpa o carrinho |

#### Teclado Numérico (Numpad)
| Ação | Descrição |
|---|---|
| `openNumpad(product)` | Abre numpad para o produto |
| `closeNumpad()` | Fecha numpad |
| `appendNumpad(digit)` | Adiciona dígito |
| `deleteNumpad()` | Apaga último dígito |
| `confirmNumpad()` | Confirma e adiciona ao carrinho |

#### Vendas
| Ação | Descrição |
|---|---|
| `completeSale(method)` | Finaliza venda, salva histórico, limpa carrinho |
| `clearSales()` | Limpa histórico de vendas |

> ⚠️ **Importante:** A venda **não** deduz estoque de insumos. A dedução acontece apenas via `produceProduct`.

#### Produção
| Ação | Retorno | Descrição |
|---|---|---|
| `produceProduct(productId, qty)` | `{ success, warnings, errors }` | Registra fabricação e deduz insumos via ficha técnica |
| `reverseProduction(productionId)` | `{ success, error? }` | Estorna produção (disponível por 30 min) |

---

## Tipos e Modelos de Dados

### `Category`
```ts
{
  id: string
  name: string
  description: string
  color: string          // Hex color
  icon: string           // Emoji
  createdAt: number      // timestamp
  updatedAt: number
}
```

### `Product`
```ts
{
  id: string
  name: string
  categoryId: string
  costPrice: number
  salePrice: number
  unit: 'un' | 'kg' | 'L'
  sku: string
  emoji: string
  imageUrl?: string      // Base64 ou URL
  isFrequent: boolean    // Exibido em destaque no PDV
  isActive: boolean      // Visível no PDV
  recipe?: RecipeItem[]  // Ficha técnica (insumos por unidade)
  createdAt: number
  updatedAt: number
}
```

### `RecipeItem`
```ts
{
  materialId: string
  quantity: number       // Quantidade por 1 unidade do produto
}
```

### `Material` (Insumo)
```ts
{
  id: string
  name: string
  unit: 'kg' | 'g' | 'L' | 'ml' | 'un' | 'cx' | 'pct'
  stockQuantity: number
  minStockQuantity: number
  costPrice: number
  supplier?: string
  expirationDate?: string  // YYYY-MM-DD
  createdAt: number
  updatedAt: number
}
```

### `StockMovement`
```ts
{
  id: string
  materialId: string
  type: 'entrada' | 'saida' | 'perda' | 'producao' | 'estorno_producao'
  quantity: number
  note?: string
  saleId?: string              // Referência à venda (legado)
  productionId?: string        // Referência ao lote de produção
  productionSnapshot?: ProductionSnapshot
  reversedMovementId?: string  // Para estorno, referencia a producao original
  createdAt: number
}
```

### `ProductionSnapshot`
```ts
{
  productId: string
  productName: string
  quantity: number
  recipeUsed: ProductionSnapshotItem[]  // Estado da receita no momento da produção
  producedAt: number
}
```

### `Sale`
```ts
{
  id: string
  items: SaleItem[]
  total: number
  method: 'dinheiro' | 'cartao' | 'cartao_credito' | 'cartao_debito' | 'pix'
  createdAt: number
}
```

---

## Telas e Componentes

### BakeryApp — Shell da Aplicação
**Arquivo:** [`components/bakery-app.tsx`](components/bakery-app.tsx)

Componente raiz da aplicação. Gerencia:
- O estado da aba ativa (`pdv` | `financeiro` | `estoque`)
- O painel de Gestão (`managing: boolean`)
- Montagem global de modais (`NumpadModal`, `CartSheet`, `CheckoutModal`)
- O `Toaster` (notificações)

```
BakeryApp
├── Header (sticky)
│   ├── Logo 🥖 + nome da loja
│   └── Botão Gestão (⚙️)
├── [managing=true] ManagementHub
└── [managing=false]
    ├── PdvScreen      (tab=pdv)
    ├── FinanceScreen  (tab=financeiro)
    ├── StockScreen    (tab=estoque)
    └── BottomNav
```

---

### PDV (Ponto de Venda)
**Arquivo:** [`components/pdv-screen.tsx`](components/pdv-screen.tsx)

Exibe o grid de produtos para venda rápida.

**Funcionalidades:**
- Filtro por categoria (chips horizontais, scroll)
- Busca por nome de produto
- Cards de produto com emoji/imagem, nome e preço
- Toque no produto → abre `NumpadModal` para selecionar quantidade
- Badge no header indicando total de itens no carrinho
- FAB/botão para abrir `CartSheet`
- Produtos `isFrequent` destacados no topo

---

### Financeiro
**Arquivo:** [`components/finance-screen.tsx`](components/finance-screen.tsx)

Dashboard financeiro do dia atual.

**Seções:**
- **Card de Faturamento do Dia** — total de vendas, número de transações, ticket médio. Background `#fff`, borda verde, valor principal em `font-weight: 800`
- **Breakdown por forma de pagamento** — cards menores para Dinheiro, PIX, Cartão Débito, Cartão Crédito
- **Histórico de vendas** — lista cronológica decrescente com itens, método e valor
- **Botão PDF** — exporta relatório do dia em PDF via jsPDF (chama `generateDailyPDF()`)

**Lógica de filtro:** Vendas do dia atual filtradas por `createdAt >= meia-noite hoje`.

---

### Estoque
**Arquivo:** [`components/stock-screen.tsx`](components/stock-screen.tsx)

Gerenciamento de insumos com duas abas:

#### Aba "Insumos"
- Alertas no topo para insumos com estoque abaixo do mínimo e com vencimento ≤ 7 dias (clicáveis como filtro)
- Busca por nome de insumo
- Cards por insumo com:
  - Nome, quantidade atual, custo/unidade
  - Barra de progresso de estoque colorida (verde/amarelo/vermelho)
  - Badges de status (⚠ Baixo, 📅 Vence em X dias)
  - Botões: **Ajustar** (drawer), **Editar** (drawer), **Excluir**
- FAB "Novo Insumo"

#### Aba "Histórico"
- Lista de todas as `StockMovement` em ordem cronológica decrescente
- Ícone e cor diferente por tipo: Entrada 🟢 / Saída 🔵 / Perda 🔴 / Produção 🌿 / Estorno 🟡
- Movimentações de **produção** com menos de 30 minutos mostram botão **"Estornar"**

#### Drawer de Ajuste de Estoque
- Seleção de tipo: Entrada / Saída / Perda
- Campo de quantidade e observação
- Confirmação chama `adjustMaterialStock()`

#### Drawer de Cadastro/Edição de Insumo
- Nome, Unidade, Custo (R$)
- Quantidade atual, Quantidade mínima
- Fornecedor (opcional)
- Data de vencimento (opcional)

---

### Gestão (Produtos e Categorias)
**Arquivo:** [`components/management-hub.tsx`](components/management-hub.tsx)

Painel acessado pelo botão ⚙️ no header. Contém duas abas:

#### Produtos (`components/products-screen.tsx`)
- Busca + filtro por categoria
- Cards de produto com: emoji/imagem, nome, categoria, preço de venda, margem %
- Ações por card:
  - **Preço** → modal de edição rápida de preço
  - **Editar** → abre `ProductFormModal` preenchido
  - **Ativar/Desativar** → `toggleProductActive()`
  - **Fabricar** → abre `ProductionModal` (apenas em produtos com ficha técnica `recipe.length > 0`)
  - **Excluir** → `ConfirmDialog` + `deleteProduct()`

#### Categorias (`components/categories-screen.tsx`)
- Lista de categorias com ícone, nome e badge colorido
- Editar / Excluir por card
- Modal de criação com nome, descrição, cor e ícone

---

## Modais e Drawers

### `NumpadModal` (`components/numpad-modal.tsx`)
Teclado numérico de tela cheia para selecionar quantidade de produto no PDV.
- Mostra nome e preço do produto selecionado
- Botões 0–9, backspace, confirmar
- `confirmNumpad()` → adiciona ao carrinho e fecha

### `CartSheet` (`components/cart-sheet.tsx`)
Gaveta lateral com os itens do carrinho.
- Listagem de itens com quantidade editável (+/-)
- Subtotal por item e total geral
- Botão "Finalizar Venda" → abre `CheckoutModal`
- Botão "Limpar" → `clearCart()`

### `CheckoutModal` (`components/checkout-modal.tsx`)
Modal de finalização de venda em 3 etapas (`Step`):

| Step | Descrição |
|---|---|
| `select` | Seleção da forma de pagamento (Dinheiro, PIX, Débito, Crédito) |
| `dinheiro` | Entrada do valor recebido + cálculo de troco |
| `cartao` | Confirmação direta para cartão |
| `done` | Tela de sucesso com animação e som (arpejo Dó-Mi-Sol via Web Audio API) |

- Ao confirmar: `completeSale(method)` — registra venda e limpa carrinho
- Suporte a **vibração háptica** (`vibrate()`)

### `ProductFormModal` (`components/product-form-modal.tsx`)
Formulário completo de produto. Campos:
- Nome, Emoji, SKU, Unidade
- Categoria (select)
- Preço de custo e preço de venda (+ cálculo de margem em tempo real)
- Upload de imagem (converte para base64)
- Flag "Produto Frequente"
- **Seção de Ficha Técnica** (collapsible): adicionar insumos com quantidade por unidade produzida

### `ProductionModal` (`components/production-modal.tsx`)
Drawer para registrar a fabricação de um produto.

**Fluxo:**
1. Exibe o produto selecionado
2. Seletor de quantidade (+/- e input numérico)
3. Painel em tempo real com cada insumo da receita:
   - 🟢 Verde: estoque OK após produção
   - 🟡 Amarelo: ficará abaixo do mínimo (aviso, mas permite confirmar)
   - 🔴 Vermelho: estoque insuficiente (botão de confirmar bloqueado)
4. Banners de erro/aviso explicativos
5. Botão "Confirmar Produção" → chama `produceProduct(productId, quantity)`

### `ConfirmDialog` (`components/modal.tsx`)
Dialog genérico de confirmação com prop `danger` para estilo vermelho.

### `PriceEditModal` (`components/quick-edit-modals.tsx`)
Modal de edição rápida do preço de venda de um produto.

---

## Fluxo de Produção

```
Usuário clica "Fabricar" (card do produto em Gestão)
    ↓
ProductionModal abre com produto selecionado
    ↓
Usuário define quantidade (ex: 50 pães)
    ↓
Sistema calcula em tempo real:
  para cada RecipeItem:
    consumo_total = recipe.quantity × quantidade_fabricar
    estoque_restante = material.stockQuantity - consumo_total
    → classifica como ok / low / critical
    ↓
[Se critical] Botão desabilitado — não permite confirmar
[Se low]     Aviso amarelo — permite confirmar com alerta
[Se ok]      Tudo verde — permite confirmar normalmente
    ↓
Confirmar → store.produceProduct(productId, quantity)
    ↓
Store:
  1. Valida todos os insumos (pré-validação sem mutação)
  2. Cria ProductionSnapshot (foto da receita neste momento)
  3. Deduz stockQuantity de cada Material
  4. Registra StockMovement.type='producao' com productionId e snapshot
    ↓
Toast de sucesso
    ↓
[Dentro de 30 min] Usuário pode ir em Estoque → Histórico → Estornar
    ↓
store.reverseProduction(productionId)
  → Restaura os insumos
  → Registra StockMovement.type='estorno_producao'
```

---

## Fluxo de Venda (PDV → Checkout)

```
PDV Screen
  → Toque no produto → NumpadModal (quantidade)
  → confirmNumpad() → addToCart(product, qty)
  → Botão carrinho → CartSheet
  → "Finalizar Venda" → CheckoutModal
      → Seleciona forma de pagamento
      → completeSale(method)
          → Cria Sale com snapshot dos itens
          → NÃO deduz estoque de insumos (isso é responsabilidade de produceProduct)
          → Limpa carrinho
          → Fecha modais
      → Tela "done" com som + animação
```

> **Regra de negócio chave:** O PDV controla apenas o fluxo de **caixa (vendas)**. O controle de **insumos** é separado e gerenciado manualmente via módulo de Produção.

---

## Geração de PDF

**Arquivo:** [`components/finance-screen.tsx`](components/finance-screen.tsx) — função `generateDailyPDF()`

O PDF diário é gerado via **jsPDF** (renderização no browser, sem servidor) e inclui:

- Cabeçalho com nome da padaria e data
- **Seção de Vendas:** lista de vendas do dia com:
  - Número da venda e horário
  - Itens: `quantidade × nome do produto`
  - Subtotais e forma de pagamento
  - Total da venda
- **Resumo financeiro:** total geral, n° de vendas, ticket médio, breakdown por forma de pagamento
- **Seção de Insumos:** lista do estado atual do estoque (nome, quantidade, unidade, custo, status)

O PDF é aberto em nova aba via `window.open(pdf.output('bloburl'))`.

---

## Persistência de Dados

### Armazenamento Local (Primário)

Todos os dados são armazenados no **IndexedDB** do navegador via `idb-keyval`:
- **Chave:** `bakeryflow-store`
- **Formato:** JSON serializado pelo middleware `persist` do Zustand
- **Dados persistidos:** categories, products, materials, movements, sales, lastQuantities, lastSaleWarnings

### Supabase (Opcional / Legado)

O arquivo [`lib/supabase.ts`](lib/supabase.ts) define um cliente Supabase e os tipos do banco. O cliente **só é instanciado** se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem configuradas. Caso contrário, `supabase = null` e o sistema funciona 100% offline com IDB.

> O Supabase foi previsto para sincronização multi-dispositivo mas não está integrado ao fluxo principal ainda.

---

## PWA e Service Worker

O app é configurado como **Progressive Web App** via **Serwist** (`@serwist/turbopack`).

- **Service Worker:** `app/sw.ts` — pré-cache de assets para uso offline
- **Manifest:** `public/manifest.json` (ícones, nome, cores)
- **Modo de exibição:** `standalone` — aparece como app nativo ao instalar

---

## Variáveis de Ambiente

Arquivo: `.env.local` (use `.env.example` como template)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ Opcional | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ Opcional | Chave anon pública do Supabase |

> Sem essas variáveis, o app funciona normalmente com persistência local (IndexedDB).

---

## Scripts e Comandos

```bash
# Desenvolvimento local
npm run dev
# ou
pnpm dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm run start

# Lint
npm run lint
```

O app roda em `http://localhost:3000` no modo desenvolvimento.

---

## Dados de Seed (Demo)

Ao iniciar pela primeira vez (sem dados no IDB), o sistema carrega dados de demonstração de [`lib/seed.ts`](lib/seed.ts):

### Categorias
| Nome | Ícone | Cor |
|---|---|---|
| Pães | 🥖 | Âmbar |
| Bebidas | ☕ | Ciano |
| Bolos | 🍰 | Rosa |
| Salgados | 🥟 | Vermelho |
| Frios | 🧀 | Índigo |
| Doces | 🍩 | Verde |

### Produtos
| Nome | Venda | Custo |
|---|---|---|
| Pão Francês | R$ 0,75 | R$ 0,30 |
| Café Expresso | R$ 5,00 | R$ 1,20 |
| Bolo de Cenoura | R$ 8,50 | R$ 3,50 |
| Coxinha | R$ 6,00 | R$ 2,00 |
| Leite | R$ 4,50 | R$ 3,00 |
| Queijo Mussarela | R$ 35,00 | R$ 22,00 |
| Pão de Queijo | R$ 1,50 | R$ 0,60 |
| Croissant | R$ 7,00 | R$ 2,50 |
| Suco de Laranja | R$ 6,50 | R$ 2,50 |
| Sonho | R$ 5,50 | R$ 2,00 |

> Os insumos (Materials) não têm seed — devem ser cadastrados manualmente pelo operador.

---

## Convenções de Código

- **Todos os componentes** são `'use client'` (Next.js App Router, app mobile sem SSR real)
- **IDs** gerados com `uid()`: `Date.now().toString(36) + Math.random().toString(36).slice(2, 7)`
- **Timestamps** em milissegundos Unix (`Date.now()`)
- **Formatação monetária** via `formatBRL(value)` em `lib/types.ts` usando `Intl` com locale `pt-BR`
- **Arredondamento de estoque** sempre com 3 casas decimais via `Math.round(x * 1000) / 1000`
- **Vibração háptica** via `vibrate(ms)` em `lib/haptics.ts` — no-op em desktop

---

*Documentação gerada em 26/06/2026 — BakeryFlow v0.1.0*
