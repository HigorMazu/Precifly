# Precify — Qual produto vale mais a pena comprar?

Plataforma de comparação inteligente de produtos que combina **preço, histórico, avaliações, confiança e Precify Score** para ajudar o usuário a decidir com clareza.

> **Visão:** Pesquisar → Encontrar → Filtrar → Comparar → Analisar preço → Analisar avaliações → Entender confiança → Ver Precify Score → Decidir.

---

## Arquitetura

```
src/
  app/                 # Next.js App Router (páginas + API routes)
    api/               # Endpoints REST (products, search, auth, wishlist, alerts, jobs)
    produto/[slug]     # Detalhe do produto (preço, gráfico, ofertas, score)
    search, comparar, wishlist, alertas, perfil, login
  components/          # Header, ProductCard, ScoreBadge, PriceChart, ComparisonBar
  domain/
    price/             # PriceStatisticsService (min, max, média, 7/30/90d)
    review/            # ReviewConfidenceService (quantidade, distribuição, recência, consistência)
    score/             # PrecifyScoreService + precify-score.config (pesos centralizados)
  services/            # SearchService (texto, filtros, preço, rating, loja, categoria, sort)
  providers/           # MockDataProvider (arquitetura de integração real, dados seed)
  jobs/                # runner (updatePrices, checkAlerts) — não bloqueia HTTP
  lib/                 # prisma, auth (jose + bcrypt), validators (zod), utils, logger
prisma/
  schema.prisma        # PostgreSQL + índices + FKs
  seed.ts              # Seed de lojas, categorias, 5 produtos, ofertas, reviews, histórico, insights
```

**Separação de responsabilidades:**
- Lógica de negócio no `domain/` e `services/` (nunca no componente).
- DTOs validados com Zod.
- Cálculo de Score e Confiança centralizados no backend.

---

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Next.js Route Handlers + Prisma 6 + PostgreSQL 16
- **Validação:** Zod
- **Auth:** bcryptjs + jose (JWT em httpOnly cookie)
- **Testes:** Vitest
- **Outros:** tsx (seed), date handling nativo

---

## Requisitos

- Node 20+ / npm
- PostgreSQL 16 (ou Docker)
- `DATABASE_URL` e `JWT_SECRET` em `.env`

---

## Instalação e execução local

```bash
# 1. Clonar e instalar
git clone https://github.com/HigorMazu/Precifly.git
cd Precifly
npm install

# 2. Configurar env
cp .env.example .env
# edite DATABASE_URL e JWT_SECRET se necessário

# 3. Subir banco (Docker)
docker compose up -d

# 4. Migrations + seed
npx prisma migrate dev
npx tsx prisma/seed.ts
# usuário demo: demo@precifly.com / 123456

# 5. Dev
npm run dev
# http://localhost:3000
```

**Sem Docker:** use PostgreSQL local e ajuste `DATABASE_URL="postgresql://precifly:precifly@localhost:5432/precifly"`

---

## Banco

**Entidades:** `users`, `stores`, `categories`, `products`, `product_specs`, `offers`, `price_history`, `reviews`, `review_insights`, `wishlists`, `wishlist_items`, `price_alerts`, `notifications`, `search_history`

- Todas com FKs, índices em `slug`, `productId`, `price`, `rating`, `userId`.
- `ProductSpec` único por `productId+key`.
- `Offer` único por `productId+storeId`.
- `WishlistItem` único por `wishlistId+productId`.
- `ReviewInsight` 1:1 com `Product`.

```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:seed       # popula mock
npx prisma studio     # GUI
```

---

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products?q=&category=&store=&minPrice=&maxPrice=&sortBy=&page=` | Listagem paginada (catálogo Precify mock) |
| GET | `/api/products/:id` | Detalhe (aceita id ou slug) |
| GET | `/api/products/:id/offers` | Ofertas ordenadas por preço |
| GET | `/api/products/:id/price-history` | Histórico + `statistics` (min,max,avg,avg7/30/90) |
| GET | `/api/products/:id/reviews?page=&limit=` | Reviews + `confidence` + `distribution` |
| GET | `/api/products/:id/score` | Precify Score (0-100, classificação, razões, alertas) |
| GET | `/api/search?q=&category=&store=&minPrice=&maxPrice=&minRating=&minReviews=&promotion=&sortBy=` | Busca com filtros no catálogo Precify |
| GET | `/api/real/search?q=&limit=` | **Produtos REAIS** — busca ao vivo (DummyJSON + fallback Amazon/KaBuM! com links de compra verdadeira) |
| GET | `/api/real/product/:id` | Detalhe do produto real para compra |
| GET | `/api/categories` | Lista categorias |
| GET | `/api/stores` | Lista lojas |
| POST | `/api/auth/register` | `{name,email,password}` |
| POST | `/api/auth/login` | `{email,password}` → set cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Usuário atual |
| GET/POST | `/api/wishlist` | Listar / adicionar `{productId,targetPrice?}` |
| DELETE | `/api/wishlist/:productId` | Remover |
| GET/POST | `/api/alerts` | Listar / criar `{productId,type,threshold}` |
| DELETE | `/api/alerts/:id` | Remover |
| POST | `/api/jobs` | Roda `updatePrices` + `checkAlerts` |

Todas com validação Zod, paginação, status HTTP apropriados e respostas consistentes.

---

## Domínio — Cálculos

### PriceStatisticsService (`src/domain/price/price-statistics.service.ts:8`)
- `current` = menor oferta atual
- `min/max/avg` sobre todo histórico
- `avg7/30/90` janela móvel por `recordedAt`

### ReviewConfidenceService (`src/domain/review/review-confidence.service.ts:15`)
**Score 0-1** combinando:
- **Quantidade:** `log10(n)/log10(5000)` (0.45)
- **Distribuição:** penaliza >95% em 5★ ou polarização 1★+5★, usa entropia (0.25)
- **Recência:** % de reviews <12 meses (0.15)
- **Consistência:** desvio padrão (0.15)

Níveis: `baixa <0.35 < média <0.6 < alta <0.85 < muito alta`. Nunca rotula como fake, apenas estima.

### PrecifyScoreService (`src/domain/score/precify-score.service.ts:18`)
**Pesos centralizados** (`precify-score.config.ts:14`):
`price 0.30, rating 0.25, volume 0.15, confidence 0.15, promotion 0.10, specs 0.05` — preparada para pesos por categoria.

Sub-scores 0-100:
- Preço vs média: `50 + diff*200`, bônus se próximo ao mínimo
- Rating: `rating/5*100`
- Volume: faixas 0/20/50/70/85/95
- Confiança: `confidence*100`
- Promoção: `60 + discount*1.5`
- Specs: placeholder 60

**Classificação:** `≥90 Excelente, ≥80 Ótima, ≥65 Boa, ≥50 Razoável, ≥35 Ressalvas, <35 Não recomendado`

Saída: `score, classification, reasons[≤4], alerts[≤3], breakdown`

---

## Frontend

- **Home** `/` — hero com banner “Produtos REAIS para comprar de verdade”, categorias, produtos em destaque, como funciona
- **Busca** `/search?mode=precify|real&q=` — toggle entre **Catálogo Precify** (com Score/histórico) e **Produtos reais** (DummyJSON → links diretos Amazon/KaBuM! com preço real); filtros, paginação, estados loading/empty/error
- **Produto Precify** `/produto/[slug]` — nome, imagem, menor preço, min/média, lojas, ofertas, rating, confiança, Precify Score, vantagens/reclamações, gráfico histórico com tooltip, specs, botões wishlist/alerta/comparar
- **Produto Real** `/real/[id]` — detalhe do produto real com preço ao vivo e botão **Comprar de verdade** (redireciona para loja oficial para pagamento seguro)
- **Comparação** `/comparar?ids=` — tabela lado a lado (preço, rating, confiança, score, min, média, lojas, vantagens/desvantagens), máx 4
- **Wishlist** `/wishlist` — auth, remover, preço alvo
- **Alertas** `/alertas` — CRUD por preço/percentual/score
- **Perfil** `/perfil` — dados + logout
- **Login/Register** — demo pré-preenchido

Compra real: todo produto em modo “Produtos reais” tem botão **Comprar agora →** com `permalink` para Amazon/KaBuM! — o usuário finaliza a compra na loja oficial, com preço verdadeiro e frete real. Para termos em PT-BR não mapeados no DummyJSON (ex: “placa de vídeo”), o sistema gera cards de busca direta na KaBuM!/Amazon para garantir que a promoção verdadeira da KaBuM! seja acessível.

Design moderno, limpo, PT-BR, responsivo (desktop/tablet/celular), estados para todas as áreas.

---

## Testes

```bash
npm test              # vitest run
npm run test:watch
```

Cobertos:
- `PriceStatisticsService` — zero, 1, múltiplos, janela 7/30, extremos
- `ReviewConfidenceService` — zero, 1, milhares, polarizado, volume alto
- `PrecifyScoreService` — range, 11% abaixo média, zero reviews, preço sem histórico, preço extremamente baixo/alto, sem oferta

---

## Segurança

- Senhas com `bcrypt` (10 rounds), nunca em texto puro
- JWT `HS256` em httpOnly cookie, `sameSite=lax`, `secure` em prod
- Validação Zod em todas as entradas
- Prisma previne SQL injection; XSS via React escaping
- `.env.example` sem secrets; `.env` ignorado
- Headers via Next.js padrão

---

## Performance

- Índices em FKs e campos de filtro
- Paginação (`limit` máx 50)
- `search` com `contains mode:insensitive` + pós-filtro em memória para rating/reviews
- `force-dynamic` onde precisa, mas sem over-fetch
- Gráfico SVG leve, sem libs pesadas

---

## Jobs

`src/jobs/runner.ts` — `jobUpdatePrices` (varia ±3% e grava `priceHistory`), `jobCheckAlerts` (cria `notification` se atingir `PRICE_BELOW`/`PERCENT_DROP`). Chamado via `POST /api/jobs` sem bloquear UI. Log estruturado.

---

## Build & Qualidade

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # next build
```

Todos passam. Projeto não apresenta mock como dado real — seed é claramente de demonstração.

---

## Roadmap IA (fase 14)

- Busca em linguagem natural, resumo de reviews, extração de temas, explicação do score, recomendações — após núcleo estável.

---

## Licença

MIT — Precify
