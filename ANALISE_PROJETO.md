# Entendimento do projeto e plano de melhorias

## O que o projeto é hoje

O **Fut Data MVP** é uma aplicação full stack com:

- **Backend Node.js + Express** (`backend/server.js`) que lê dados locais em JSON (`backend/data/*.json`) e expõe endpoints para:
  - saúde (`/health`);
  - listagem e filtros de jogadores (`/api/players`);
  - metadados de times/posições (`/api/teams`, `/api/positions`);
  - rankings por métricas simuladas (`/api/rankings`);
  - detalhe de jogador com percentis (`/api/players/:id`);
  - export CSV de jogadores e técnicos (`/api/players.csv`, `/api/coaches.csv`);
  - listagem/detalhe de treinadores (`/api/coaches`, `/api/coaches/:id`).

- **Frontend React + Vite** (`frontend/src/App.jsx`) em uma única página com:
  - abas de jogadores e treinadores;
  - filtros de busca;
  - rankings clicáveis;
  - comparação entre dois jogadores;
  - favoritos persistidos em `localStorage`;
  - exportação de favoritos em JSON;
  - compartilhamento de estado por query string.

## Diagnóstico rápido

### Pontos fortes

1. Escopo do MVP está bem definido e funcional.
2. API possui endpoints úteis para exploração e export.
3. Frontend cobre fluxo completo de descoberta -> detalhe -> comparação.
4. UX tem recursos úteis para demo (favoritos, link compartilhável, export CSV/JSON).

### Limitações atuais

1. **Dados e métricas mockados**: `mockMetrics()` gera números fixos por posição, o que compromete análises reais.
2. **Acoplamento alto no frontend**: `App.jsx` concentra estado, UI e regras de negócio no mesmo arquivo.
3. **Ausência de testes automatizados** (backend e frontend).
4. **Sem validação formal de entrada** (query params e IDs).
5. **Pouca observabilidade** (sem logs estruturados, sem correlação de erro, sem métricas).
6. **Documentação técnica incompleta** (README raiz inexistente e README frontend genérico do template Vite).

## Melhorias recomendadas em etapas

## Etapa 1 — Estabilização e qualidade básica (prioridade alta)

1. Criar um **README raiz** com visão do sistema, arquitetura, setup e exemplos de uso da API.
2. Adicionar **padronização de ambiente**:
   - `.env.example` em backend/frontend;
   - padronização de scripts (`dev`, `test`, `lint`) nos dois lados.
3. Configurar **lint/format** no backend (ESLint + Prettier) e corrigir formatação atual.
4. Implementar **tratamento de erros centralizado** no Express com middleware de erro.
5. Criar testes iniciais:
   - backend: smoke tests dos endpoints principais;
   - frontend: teste de render e interações básicas.

## Etapa 2 — Organização de código e manutenção

1. Quebrar `frontend/src/App.jsx` em módulos:
   - componentes (`components/`),
   - hooks (`hooks/`),
   - serviços (`services/`),
   - utilitários (`utils/`).
2. Extrair serviços de API do backend para camadas:
   - `routes/`, `controllers/`, `services/`, `repositories/`.
3. Adotar tipagem com **TypeScript** gradualmente (começando pelo frontend).
4. Definir contratos de API com **OpenAPI/Swagger** para reduzir ambiguidade.

## Etapa 3 — Dados e consistência analítica

1. Trocar métricas mock por fonte real (ou dataset mais completo) e criar pipeline de atualização.
2. Definir regras explícitas de cálculo de percentis e rankings (com documentação).
3. Incluir filtros adicionais (temporada, competição, minutos mínimos).
4. Garantir consistência de nomes/chaves (normalização de campos e validação de schema).

## Etapa 4 — Produto e UX

1. Melhorar responsividade (layout atual presume desktop em várias seções).
2. Adicionar estados de loading/skeleton e feedbacks de erro por contexto.
3. Melhorar acessibilidade (foco por teclado, contraste, `aria-labels`).
4. Permitir ordenar colunas e salvar filtros favoritos.

## Etapa 5 — Produção e operação

1. Containerização com Docker + compose para execução local reproduzível.
2. CI/CD com pipeline de lint + test + build.
3. Observabilidade:
   - logs estruturados;
   - monitoramento de disponibilidade;
   - alertas básicos.
4. Segurança:
   - rate limiting;
   - helmet;
   - validação de input;
   - revisão de CORS e headers.

## Quick wins (fazer primeiro)

1. README raiz + `.env.example`.
2. Testes smoke do backend.
3. Refatorar `App.jsx` em componentes pequenos.
4. Middleware de erro no backend.
5. Lint/format rodando em CI.

---

Se quiser, no próximo passo eu posso transformar este plano em **backlog técnico priorizado (com esforço, impacto e ordem de execução)**.
