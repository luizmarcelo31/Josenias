# Lógica de Produção de Produtos — v5

O cliente solicitou que a redução de estoque de insumos não seja mais feita no momento da venda (checkout), mas sim através de uma etapa manual de "Fabricação/Produção". Ao produzir X pães, o sistema deduzirá os insumos correspondentes baseados na ficha técnica (receita).

---

## Alterações Propostas

### 1. `lib/types.ts`

- Adicionar `'producao'` ao tipo `MovementType`.
- Adicionar `'estorno_producao'` ao tipo `MovementType` para suportar reversões.
- Adicionar interface `ProductionSnapshot` para registrar o estado da receita no momento da produção:

```ts
interface ProductionSnapshot {
  productId: string;
  productName: string;
  quantity: number;
  recipeUsed: { materialId: string; materialName: string; amountPerUnit: number }[];
  producedAt: string; // ISO timestamp
}
```

---

### 2. `lib/store.ts`

#### Remover dedução de ingredientes do checkout
- Remover a chamada `deductRecipeIngredients` do método `completeSale`.
- Vendas não afetarão mais o estoque de insumos.

#### Novo método: `produceProduct`

```ts
produceProduct(productId: string, quantity: number): {
  success: boolean;
  warnings: string[];  // Insumos que ficarão abaixo do mínimo
  errors: string[];    // Insumos com estoque insuficiente (produção bloqueada)
}
```

**Comportamento:**
- Buscar a receita do produto. Se não houver receita, retornar erro imediatamente.
- Validar o estoque **antes** de qualquer dedução:
  - Se qualquer insumo ficaria **negativo** → bloquear produção, retornar `errors`.
  - Se qualquer insumo ficaria **abaixo do mínimo configurado** → permitir, mas retornar `warnings`.
- Salvar um `ProductionSnapshot` junto ao registro de movimentação (não apenas referência ao `productId`).
- Registrar movimentação com `tipo: 'producao'` e `note: 'Produção: [nome do produto] x[qtd]'`.

#### Novo método: `reverseProduction`

```ts
reverseProduction(movementId: string): { success: boolean; error?: string }
```

**Comportamento:**
- Só permitir reversão dentro de uma janela de **30 minutos** após o registro.
- Restaurar os insumos com base no `ProductionSnapshot` salvo na movimentação original.
- Registrar nova movimentação com `tipo: 'estorno_producao'` e `note: 'Estorno da produção [movementId]'`.

---

### 3. Modais e UI

#### [NEW] `components/production-modal.tsx`

Modal para fabricação de um produto:

- Recebe o produto a ser fabricado.
- Campo para selecionar a quantidade a produzir.
- Painel de resumo em tempo real com os insumos que serão consumidos.
- **Feedback visual por cor nos insumos:**
  - 🟢 Verde: estoque permanece acima do mínimo.
  - 🟡 Amarelo: estoque ficará abaixo do mínimo (warning).
  - 🔴 Vermelho: estoque ficará negativo (botão de confirmar desabilitado).
- Botão "Confirmar Produção" desabilitado enquanto houver `errors`.
- Exibir `warnings` como alerta visual antes da confirmação.

#### [MODIFY] `components/products-screen.tsx`

- Exibir ação de produção (`ChefHat` ou `Factory`) apenas nos cards de produtos **com receita cadastrada**.
- Ao clicar, abrir `ProductionModal` para aquele produto.

#### [MODIFY] `components/stock-history-screen.tsx` *(ou equivalente)*

- Exibir movimentações do tipo `'producao'` com ícone distinto.
- Para movimentações `'producao'` com menos de 30 minutos, exibir botão **"Estornar"**.
- Ao clicar em "Estornar", confirmar via dialog e chamar `reverseProduction(movementId)`.
- Movimentações do tipo `'estorno_producao'` devem exibir referência à produção original.

---

## Verificação

### Testes Manuais

#### Caminho Feliz
- [ ] Realizar uma venda e confirmar que o estoque de insumos **não foi alterado**.
- [ ] Abrir o Painel de Produtos e clicar em "Produzir" em um produto com ficha técnica.
- [ ] Confirmar produção e verificar se o modal exibe os insumos consumidos corretamente.
- [ ] Acessar o estoque e confirmar que os insumos reduziram na proporção correta.
- [ ] Verificar se o histórico de movimentação registrou `tipo: 'producao'` com o snapshot da receita.

#### Cenários de Borda
- [ ] Tentar produzir com estoque **insuficiente**: botão deve estar desabilitado e insumo destacado em vermelho.
- [ ] Produzir com insumo que ficará **abaixo do mínimo**: deve exibir warning amarelo, mas permitir confirmação.
- [ ] Clicar em "Estornar" dentro de 30 minutos: insumos devem ser restaurados e novo registro `'estorno_producao'` criado.
- [ ] Tentar estornar após 30 minutos: botão não deve aparecer ou deve retornar erro claro.
- [ ] Alterar a ficha técnica de um produto e produzir novamente: verificar se o snapshot salvo corresponde à receita **no momento da produção** (não à atual).
- [ ] Tentar produzir quantidade `0` ou valor negativo: input deve rejeitar ou botão deve permanecer desabilitado.
- [ ] Produto sem receita cadastrada: ícone de produção **não deve aparecer** no card.

---

## Resumo das Mudanças por Arquivo

| Arquivo | Tipo | Descrição |
|---|---|---|
| `lib/types.ts` | Modificar | Adicionar `'producao'`, `'estorno_producao'` e `ProductionSnapshot` |
| `lib/store.ts` | Modificar | Remover `deductRecipeIngredients` do checkout; adicionar `produceProduct` e `reverseProduction` |
| `components/production-modal.tsx` | Novo | Modal de produção com validação visual em tempo real |
| `components/products-screen.tsx` | Modificar | Adicionar ação de produção nos cards com receita |
| `components/stock-history-screen.tsx` | Modificar | Exibir botão de estorno em produções recentes |
