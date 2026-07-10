# O Rebanho de Jesus Cristo — Style Guide

Guia de design do app de gestão. **Claro (light-first)**, quente e editorial — nascido da
**logo do Bom Pastor** (verde do anel, azul do manto, chama pentecostal, creme do cordeiro).
Existe também uma **página viva** em `/style` dentro do app.

> Regra de ouro: **nunca** use cores cruas (`#2FA24B`, `bg-green-500`) nas telas.
> Use sempre os tokens semânticos (`bg-primary`, `text-muted-foreground`, `border-border`…).
> Tudo em CSS variables mapeadas para o Tailwind v4 em [`src/styles/globals.css`](src/styles/globals.css).

---

## 1. Marca

- **Nome:** O Rebanho de Jesus Cristo · Igreja Pentecostal · 1990.
- **Emblema:** o Bom Pastor com o cordeiro e o cajado sobre a chama — [`Emblem`](src/components/brand/logo.tsx).
- **Marca compacta:** anel verde + chama + cajado — [`Logomark`](src/components/brand/logo.tsx).
- **Personalidade:** sagrada, acolhedora, transparente, humana (**não** techy, **não** "cara de IA").

## 2. Cores (tokens)

| Token | Uso | Light |
|---|---|---|
| `background` | fundo (creme/pergaminho) | `#F7F4EC` |
| `card` / `popover` | superfícies | `#FFFFFF` |
| `foreground` | texto | `#17231C` |
| `muted-foreground` | texto secundário | `#5C6B60` |
| `primary` | **ação (Verde Rebanho)** | `#1E7D3A` |
| `brand-green` | verde do anel (marca/gráficos) | `#2FA24B` |
| `brand-blue` / `info` | Azul Pastor (manto) | `#3B79B0` |
| `warning` | vencendo | `#E8992B` |
| `destructive` | atrasado / déficit | `#D8382A` |
| `border` / `input` | bordas e campos | `#E6E1D5` |
| **Chama** | gradiente sagrado | `#F6C136 → #EF8A2B → #E24329` |
| `chart-1..5` | séries | verde, azul, laranja, âmbar, vermelho |

**Semântica financeira:** entradas = **verde**; saídas = **laranja** (chama); vencido/déficit =
**vermelho**; vencendo = **âmbar**. Dízimo (verde) · Oferta (azul) · Outras (âmbar) nos gráficos.
Contraste alvo **WCAG AA**. Modo **escuro** opcional (fundo `#0F1712`).

**Utilitários de marca:** `.text-flame` · `.bg-flame` · `.bg-flame-glow` · `.bg-brand-mesh` ·
`.glass` · `.shadow-warm` · `.ring-brand` · `.tabular` (números financeiros).

## 3. Tipografia

- **Títulos:** `font-display` → **Fraunces Variable** (serifa óptica quente, editorial).
- **Corpo/UI:** `font-sans` → **Plus Jakarta Sans Variable** (humanista, amigável).
- **Dinheiro:** classe `.tabular` (`tabular-nums`).
- Fontes **self-hosted** via `@fontsource-variable` (offline, sem CDN — essencial no PWA).

## 4. Fundamentos

- **Espaçamento:** escala de 4px do Tailwind. **Raio:** `--radius: 1rem` (cards `rounded-2xl`).
- **Sombra:** `.shadow-warm` (quente e sutil). **Layout:** bento grid em dashboards.
- **Motion:** discreto (Framer Motion) — transições de página e `active:scale-[0.98]`.
- **Mobile-first / PWA:** áreas seguras (`.pt-safe` / `.pb-safe`), bottom nav, instalável.

## 5. Componentes (`src/components/ui`)

Base **shadcn-style sobre Radix**, React 19, `data-slot` para hooks de estilo:
Button · Badge · Card · Input · Label · Select · Switch · Tabs · Dialog · Sheet ·
DropdownMenu · Avatar · Progress · Separator · Segmented · Skeleton · Sonner.

**Compostos / marca:** `StatCard` · `MoneyText` · `StatusBadge` · `CategoryIcon` · `FundBadge` ·
`FormaTag` · `PeriodPicker` · `EmptyState` · `PageHeader` · `InstallPrompt` · `Logo`/`Logomark`.
**Gráficos:** `DonutChart` · `CashflowChart` · `Sparkline` (Recharts com tokens).

## 6. Variantes principais

- **Button:** `default` (verde) · `flame` (gradiente) · `secondary` · `outline` · `ghost` ·
  `subtle` · `destructive` · `link` — tamanhos `sm/default/lg/icon/icon-sm`.
- **Badge:** `default` `secondary` `outline` `success` `warning` `danger` `info` `gold`.

## 7. Convenções

- Imports por alias `@/…`. Classes combinadas com `cn()` ([`src/lib/utils.ts`](src/lib/utils.ts)).
- Formatação sempre via [`src/lib/format.ts`](src/lib/format.ts): `formatBRL`, `formatDate`,
  `formatCompetencia`, `initials`…
- Idioma **pt-BR**, moeda **BRL**, datas locais.
