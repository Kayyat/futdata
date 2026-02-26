# Fut Data MVP

Aplicação full stack para exploração de dados de jogadores e treinadores, com filtros, rankings, comparação de perfis e exportações.

## Arquitetura

- **Backend**: Node.js + Express (`backend/`) com dados locais em JSON.
- **Frontend**: React + Vite (`frontend/`) consumindo a API.

## Requisitos

- Node.js 20+
- npm 10+

## Setup rápido

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API disponível em `http://localhost:3001`.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App disponível em `http://localhost:5173`.

## Scripts úteis

### Backend

- `npm run dev`: inicia com nodemon.
- `npm start`: inicia em modo produção.
- `npm test`: executa testes smoke da API.

### Frontend

- `npm run dev`: desenvolvimento com Vite.
- `npm run build`: build de produção.
- `npm run lint`: lint do frontend.

## Endpoints principais

- `GET /health`
- `GET /api/players`
- `GET /api/players/:id`
- `GET /api/players.csv`
- `GET /api/teams`
- `GET /api/positions`
- `GET /api/rankings`
- `GET /api/coaches`
- `GET /api/coaches/:id`
- `GET /api/coaches.csv`

## Observações

- O projeto ainda utiliza dados locais em `backend/data/*.json`.
- Métricas de jogadores e impacto de treinadores são mockadas/determinísticas, úteis para MVP e testes de fluxo.


## Consumindo dados da API-Football

O backend já está preparado para consumir dados da `api-football.com` (API-Sports) nos endpoints existentes de jogadores e treinadores.

### Configuração

No `backend/.env` configure:

```env
API_FOOTBALL_USE_LIVE=true
API_FOOTBALL_KEY=sua_chave_aqui
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_DEFAULT_LEAGUE=71
API_FOOTBALL_DEFAULT_SEASON=2024
```

### Como funciona

- Com `API_FOOTBALL_USE_LIVE=true` e chave válida, o backend usa dados remotos.
- Se desativado (ou sem chave), o backend mantém fallback para os JSONs locais.
- O endpoint `GET /health` retorna `data_mode` (`api-football` ou `local`).

### Parâmetros úteis

Para `GET /api/players` (e endpoints derivados como rankings/teams/positions):

- `league` (opcional)
- `season` (opcional)
- `page` (opcional)
- `q` (opcional, busca por nome)

Exemplo:

```bash
curl "http://localhost:3001/api/players?league=71&season=2024&page=1&q=pedro"
```
