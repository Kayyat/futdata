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
