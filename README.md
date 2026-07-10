# O Rebanho de Jesus Cristo — Gestão Financeira

**PWA mobile-first** para a gestão financeira da **Igreja Pentecostal O Rebanho de Jesus Cristo**
(1990). Registra **dízimos, ofertas e demais entradas**, **gastos/saídas** e **contas a pagar**, e
dá ao **pastor** uma visão completa do que entra e sai — quem está contribuindo, para onde vai o
dinheiro e os compromissos da igreja — além de gerar um **relatório de prestação de contas** (A4,
impressão / PDF) para enviar ao **Pastor Presidente**, mensal ou trimestralmente.

> Fase atual: **frontend completo** — as três experiências por papel (**Pastor**, **Tesoureiro** e
> **Irmãos**) já implementadas, com dados de exemplo persistidos em `localStorage`. A arquitetura
> está pronta para plugar um backend real sem reescrever a UI.

---

## ✨ Recursos (Fase 1 — Pastor)

- **Painel (bento):** saldo em caixa, entradas/saídas/resultado com comparação de período,
  composição de entradas (dízimos × ofertas × outras), fluxo de caixa (6 meses), para onde vai o
  dinheiro, contas a pagar próximas, fundos designados e nº de dizimistas.
- **Dízimos & Ofertas:** quem está contribuindo, filtros, busca, **detalhe do membro** (histórico,
  constância mensal, total no ano) e exportação CSV.
- **Saídas & Gastos:** por categoria, com fornecedor, fundo, comprovante e CSV.
- **Contas a Pagar:** em aberto / vencidas / pagas, com totais e "marcar como paga".
- **Relatórios:** pré-visualização **A4** de prestação de contas + **Imprimir / Salvar PDF** +
  histórico. Períodos **mensal / trimestral / personalizado**.
- **Membros, Fundos** (com metas de campanha), **Style Guide** (`/style`) e **Configurações**.
- **PWA de verdade:** instalável, service worker, **offline**, ícones gerados da logo, tema
  claro/escuro.

## 🧱 Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** + componentes **shadcn-style** (sobre Radix)
- **PWA** (`vite-plugin-pwa`) · **Recharts** · **React Router** · **Zustand** ·
  **React Hook Form + Zod** · **date-fns** · **sonner** · **framer-motion** · **react-to-print**

Design system documentado em [`STYLEGUIDE.md`](STYLEGUIDE.md) e na página viva `/style`.

## ✨ Recursos (Fase 2 — Tesoureiro)

- **Home operacional:** movimento do mês (entradas/saídas/saldo), pendências e últimos lançamentos.
- **Registro rápido** (atalhos + **FAB "+"**): **Dízimo**, **Oferta**, **Despesa** e **Conta a
  pagar** — formulários mobile com validação (Zod) e entrada monetária dedicada.
- **Lançamentos:** lista unificada de entradas e saídas, filtros, busca, **exclusão** e CSV.
- **Navegação por papel:** o app troca as abas e a home conforme o usuário (Pastor × Tesoureiro).

## ✨ Recursos (Fase 3 — Irmãos)

- **Transparência:** resumo agregado do mês (arrecadado/aplicado/em caixa) e **"para onde vai a sua
  oferta"** — sem expor nenhum dado individual de outro membro.
- **Prestação de contas:** gastos do período e **o que a igreja precisa pagar** (read-only).
- **Campanhas:** progresso dos fundos (Missões, Construção…) com metas.
- **Contribuir:** chave **Pix** com QR Code e copiar, e o significado de dízimo × oferta.
- **Minha conta:** histórico da **própria** contribuição, total no ano e **recibo/comprovante anual
  em PDF**. Privacidade garantida por rotas protegidas por papel (`RoleGuard`).

## 🚀 Como rodar

```bash
npm install
npm run gen:icons   # gera os ícones do PWA a partir de image.png (logo)
npm run dev         # http://localhost:5173
npm run build       # build de produção + PWA
npm run preview     # pré-visualiza o build
```

Na tela de login há os atalhos **"Pastor"** e **"Tesoureiro"** (demonstração).
Contas semente usam a senha `rebanho123` (`pastor@rebanho.app`, `tesouraria@rebanho.app`).

## 📌 Próximas fases

- **Irmãos:** login individual, transparência agregada, "Minha Contribuição" + recibo em PDF.
- **Backend:** trocar `src/data/services.ts` por API/Supabase sem reescrever a UI; autenticação real.

---

<sub>Feito com 💚 para O Rebanho de Jesus Cristo.</sub>
