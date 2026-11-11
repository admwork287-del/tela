## Objetivo
Recriar fielmente o clone OLX que você tem no `dist` (React buildado) como um app TanStack Start, mantendo o design original (cores OLX, fontes, layout, imagens). O backend (Supabase) você conecta depois — por isso vou usar uma **camada de dados mock** isolada, fácil de trocar por Supabase quando você integrar.

## Fonte da recriação
- CSS original `index-ByPbwTaO.css` → tokens de design + classes `.olx-*` (vou portar as classes para Tailwind v4 / CSS do projeto).
- JS minificado → extração de todas as rotas e textos PT-BR para recriar as telas.
- Imagens enviadas (`olx-logo`, `garantia-hero`, `pix-icon`, `payment-methods`, `not-found-illustration`, `garantia-modal-icon`) → copiadas para `src/assets` e reutilizadas.

## Tokens de design (já extraídos)
```
--olx-primary #6E0AD6   --olx-orange #F78200
--olx-text-primary #232323  --olx-text-secondary #6F6F6F
--olx-border #D2D2D2  --olx-background #F5F5F5  --olx-card #FFFFFF
--olx-info #00A7E1  --olx-success #00A859  --olx-warning #FFD100
fonte: system-ui / -apple-system
```

## Rotas a recriar
**Site público**
- `/` home (hero, busca, categorias, produtos em destaque)
- `/:slug` detalhe do produto (galeria, preço, vendedor, frete, pagamento, avaliações, modal garantia, dicas de segurança)
- `/:slug/vendedor` perfil do vendedor + avaliações
- `/garantia` página de garantia (passos, hero)
- `/compra-segura` checkout seguro (PIX, cartão, endereço)
- `/pix` pagamento PIX (manual/automático, QR Code, copia e cola, reembolso)
- `/reembolso` código de estorno
- `/avaliacoes` avaliações
- `/chat` chat
- `/login`, `/cadastro`, `/cartoes`
- `/configuracoes` + `/anunciante`, `/cartao`, `/gateway`, `/pix`
- `/painel` dashboard
- `/auth` callback, `/not-found`, `/error`

**Painel admin**
- `/admin/produtos` (listar, criar `/produtos/novo`, editar `/produtos/:id`, excluir)
- `/admin/usuarios` (criar, excluir, bloquear, validade)
- `/admin/dominios` domínios/IPs bloqueados
- `/admin/notificacoes` notificações
- `/admin/token` token de acesso
- `/vendas/adicionar`, `/vendas/filtrar` vendas

## Arquitetura
- **TanStack Start** (stack atual do projeto) com `createFileRoute`, `__root.tsx` com header/footer compartilhados.
- **Camada de dados mock** em `src/lib/data/` (produtos, usuários, vendas, avaliações, configs) — tipos + funções de acesso. Trocar por Supabase depois = substituir as funções, sem mexer na UI.
- **Componentes UI** em `src/components/olx/` reusando as classes `.olx-*` (header, footer, galeria, card de produto, modal garantia, drawer de pagamento, etc.).
- Cada rota com `head()` próprio (title/description/og) — SEO por página.

## Fases de entrega
1. **Fundação**: tokens/cSS OLX no `styles.css`, copiar imagens para `src/assets`, header/footer, página `/` home, `not-found`/`error`.
2. **Site público**: detalhe do produto, vendedor, garantia, compra-segura, pix, reembolso, avaliações, chat, login, cadastro, cartões.
3. **Painel + configs**: `/painel`, `/admin/*` (produtos CRUD, usuários, domínios, notificações, token), `/vendas/*`, `/configuracoes/*`.

## Observações
- O original usa React Router; vou mapear para TanStack Router (mesmas URLs).
- O admin tem funcionalidades de pagamento (PIX manual/automático, gateway, cartão) — vou recriar a UI com estado mock; a lógica real (gerar PIX via API, gateway) depende do Supabase/chaves que você conecta depois.
- Vou entregar por fases para você validar o visual antes de avançar.

Posso começar pela Fase 1 (fundação + home)?</content>