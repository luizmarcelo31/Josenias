# Plano de Implementação v3: Ficha Técnica + Bug Fix NaN

**Objetivo:** Implementar dedução automática de insumos ao vender produtos com ficha técnica cadastrada, e corrigir o bug de `NaN` no campo de quantidade da tela de Estoque.

---

## Decisão Tomada: Estoque Negativo

**Estoque NÃO pode ficar negativo. O piso é zero (`Math.max(0, novoEstoque)`).**

Justificativa: estoque negativo em um PDV de padaria é um dado sem significado operacional — o padeiro não tem como usar -2 kg de farinha. O correto é o sistema avisar *antes* da venda que o estoque está insuficiente, não deixar o dado corrompido silenciosamente. O comportamento adotado:

- Se o estoque for suficiente → deduz normalmente.
- Se o estoque for **insuficiente para qualquer item da ficha técnica** → a venda **ainda é concluída** (o PDV não pode travar o caixa), mas um aviso visual é exibido ao operador após a confirmação: *"Atenção: estoque de [Farinha de Trigo] insuficiente. Registrado como 0 kg."*
- O estoque para em `Math.max(0, quantidade - consumo)`, nunca negativo.
- O `StockMovement` registra a quantidade **efetivamente deduzida** (não o consumo teórico), garantindo rastreabilidade.

---

## Ordem de Execução

> Implementar nesta sequência. Cada passo tem dependência do anterior.

---

### Passo 1 — Bug Fix: NaN no campo de quantidade (`stock-screen.tsx`)

**Problema:** `parseFloat('')` retorna `NaN`, quebrando o `value` do input controlado do React.

**Solução completa:**

```tsx
// Ruim — causa NaN
const qty = parseFloat(e.target.value)
setQty(qty)

// Correto — usar string como estado intermediário
const [qtyInput, setQtyInput] = useState<string>('')

// No onChange: guardar a string crua
onChange={(e) => setQtyInput(e.target.value)}

// No value: sempre string
value={qtyInput}

// Na hora de usar o número (submit):
const qty = parseFloat(qtyInput)
if (isNaN(qty) || qty <= 0) {
  // exibir erro: "Informe uma quantidade válida"
  return
}
```

Aplicar o mesmo padrão em **todos** os inputs numéricos da tela de Estoque: quantidade atual, quantidade mínima, custo por unidade.

Também adicionar `inputMode="decimal"` nos inputs para exibir teclado numérico no mobile.

---

### Passo 2 — Tipagens (`lib/types.ts`)

Adicionar `RecipeItem` e atualizar `Product`:

```ts
export interface RecipeItem {
  materialId: string
  quantity: number   // quantidade do insumo por 1 unidade do produto
  // ex: { materialId: 'farinha-id', quantity: 0.05 } = 50g de farinha por pão
}

export interface Product {
  // ... campos existentes ...
  stockQuantity?: number      // @legacy — não usado no fluxo de vendas
  minStockQuantity?: number   // @legacy
  recipe?: RecipeItem[]       // ficha técnica — opcional, produtos sem ficha não deduzem
}
```

Adicionar campo à `StockMovement` para rastrear origem da dedução:

```ts
export interface StockMovement {
  id: string
  materialId: string
  type: 'entrada' | 'saida' | 'perda'
  quantity: number             // quantidade efetivamente movimentada (sempre positivo)
  note?: string
  saleId?: string              // referência à venda que gerou o movimento (novo)
  createdAt: string
}
```

---

### Passo 3 — Estado Global (`lib/store.ts`)

#### 3a. Função auxiliar de dedução (criar separadamente, não inline em `completeSale`)

```ts
// Retorna lista de avisos caso algum insumo tenha ficado insuficiente
function deductRecipeIngredients(
  cart: CartItem[],
  materials: Material[],
  saleId: string
): { updatedMaterials: Material[]; movements: StockMovement[]; warnings: string[] }
```

Lógica interna:
1. Agrupar consumo por `materialId` somando todos os produtos do carrinho que têm ficha técnica.
   ```
   consumo['farinha-id'] = (paoFrances.recipe[0].quantity * qtdPao) + (croissant.recipe[0].quantity * qtdCroissant)
   ```
2. Para cada `materialId` com consumo > 0:
   - Calcular `novoEstoque = Math.max(0, material.stockQuantity - consumo)`
   - Se `consumo > material.stockQuantity` → adicionar à lista de `warnings`
   - Registrar `StockMovement` com `quantity = Math.min(consumo, material.stockQuantity)` (dedução real) e `saleId`
3. Retornar materiais atualizados, movimentos e avisos.

#### 3b. Atualizar `completeSale`

```ts
completeSale: (paymentMethod: string) => {
  const saleId = generateId()
  
  // 1. Deduzir insumos (novo)
  const { updatedMaterials, movements, warnings } = deductRecipeIngredients(
    state.cart, state.materials, saleId
  )
  
  // 2. Registrar venda normalmente
  const sale: Sale = { id: saleId, items: state.cart, ... }
  
  // 3. Atualizar estado
  set({
    sales: [...state.sales, sale],
    materials: updatedMaterials,
    stockMovements: [...state.stockMovements, ...movements],
    cart: [],
    lastSaleWarnings: warnings,  // novo campo — lido pela tela de sucesso
  })
}
```

Adicionar `lastSaleWarnings: string[]` ao estado (reset para `[]` ao iniciar nova venda).

---

### Passo 4 — Modal de Produto com Ficha Técnica (`product-form-modal.tsx`)

#### Estrutura do formulário

Após os campos existentes (nome, preço, emoji, categoria), adicionar seção colapsável:

```
┌─────────────────────────────────────┐
│ ▼ Ficha Técnica (opcional)          │
│                                     │
│ Insumos consumidos por unidade      │
│                                     │
│ [Selecionar insumo ▾]  [Qtd] [un] [+]│
│                                     │
│ • Farinha de Trigo   0,05 kg   [✕] │
│ • Manteiga           0,01 kg   [✕] │
│                                     │
│ Custo estimado de insumos: R$ 0,28  │  ← calculado automaticamente
└─────────────────────────────────────┘
```

Comportamento:
- Seção começa **fechada** se o produto não tem ficha; **aberta** se já tem itens.
- Select de insumo lista apenas `materials` cadastrados. Se não há insumos: *"Cadastre insumos na aba Estoque primeiro."*
- Ao selecionar um insumo, a unidade aparece ao lado do campo de quantidade (kg, g, L…).
- Não permitir o mesmo `materialId` duas vezes na ficha — mostrar erro: *"Este insumo já está na ficha."*
- Campo de quantidade: `inputMode="decimal"`, mínimo 0.001, validação de NaN igual ao Passo 1.
- **Custo estimado** = soma de `(recipeItem.quantity * material.costPrice)` — exibir em muted abaixo da lista. Útil para o padeiro saber se o preço de venda cobre os insumos.

---

### Passo 5 — Aviso Pós-Venda na Tela de Sucesso

Após confirmar a venda, se `lastSaleWarnings.length > 0`, exibir abaixo do total:

```
┌─────────────────────────────────┐
│ ⚠ Estoque insuficiente          │
│ Farinha de Trigo: registrado    │
│ como 0 kg após esta venda.      │
│ Faça uma entrada no Estoque.    │
└─────────────────────────────────┘
```

- Visual: fundo #FFFBEB, borda #FDE68A, texto #92400E — amber/warning.
- Exibir cada insumo afetado em linha separada.
- O aviso **não bloqueia** o botão "Nova venda".

---

## Verification Plan

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Deixar campo de quantidade vazio na tela Estoque | Input não quebra, não exibe NaN, mostra string vazia |
| 2 | Submeter ajuste de estoque com campo vazio | Erro inline: "Informe uma quantidade válida" |
| 3 | Cadastrar produto sem ficha técnica e vender | Venda concluída, nenhum `StockMovement` gerado, sem avisos |
| 4 | Cadastrar Pão Francês com ficha: 0,05 kg de Farinha | Ficha salva, custo estimado exibido corretamente |
| 5 | Tentar adicionar Farinha duas vezes na ficha | Erro: "Este insumo já está na ficha" |
| 6 | Vender 10 Pães Franceses (estoque de Farinha: 2 kg) | Estoque vai de 2 kg para 1,5 kg (consumo: 0,5 kg), sem aviso |
| 7 | Vender 60 Pães Franceses (estoque: 1,5 kg, consumo teórico: 3 kg) | Estoque vai para 0 kg, aviso amarelo exibido: "Farinha de Trigo: registrado como 0 kg" |
| 8 | Verificar aba Estoque após teste 7 | Farinha exibe 0 kg com badge `⚠ BAIXO` |
| 9 | Verificar histórico de movimentações da Farinha | `StockMovement` com `type: 'saida'`, `quantity: 1.5` (real), `saleId` preenchido |
| 10 | Recarregar o app | Fichas técnicas, estoque e movimentações persistem via LocalStorage |
| 11 | Remover um insumo do Estoque que está em fichas técnicas | Fichas técnicas dos produtos que usavam esse insumo ficam com `materialId` órfão — verificar que o app não crasha (filtrar `RecipeItem` cujo `materialId` não existe mais em `materials`) |

---

## Casos Limite Importantes

**Insumo deletado ainda referenciado numa ficha:**
Ao renderizar a ficha técnica de um produto, filtrar `recipe.filter(r => materials.find(m => m.id === r.materialId))`. Itens órfãos são silenciosamente ignorados na dedução e não exibidos no modal — sem crash.

**Produto com `recipe: []` (ficha vazia):**
Tratar igual a `recipe: undefined` — sem dedução.

**Precisão de float:**
Usar `Math.round(qty * 1000) / 1000` ao gravar e ao exibir quantidades de insumo para evitar artefatos de ponto flutuante (ex: 0.050000000000000003).

---

## Fora do Escopo desta Versão (backlog)

- Custo de produção no relatório PDF (insumos consumidos × custo unitário)
- Alerta preventivo *antes* de finalizar a venda se algum insumo está insuficiente
- Histórico de movimentações por insumo com filtro de data
- Exportar ficha técnica em PDF

