const test = require("node:test");
const assert = require("node:assert/strict");

const { app } = require("../app");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test("GET /health retorna status ok", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/health`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, "fut-data-mvp-backend");
  });
});

test("GET /api/players retorna lista com count", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/players`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(Array.isArray(body.players), true);
    assert.equal(typeof body.count, "number");
  });
});

test("GET /api/players/:id inválido retorna 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/players/abc`);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.match(body.error, /inválido/i);
  });
});

test("GET /api/coaches/:id inexistente retorna 404", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/coaches/9999`);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.match(body.error, /não encontrado/i);
  });
});

test("GET /api/players.csv retorna csv", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/players.csv`);
    const text = await res.text();

    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/csv/);
    assert.match(text, /id,nome,posicao,time,idade,pe/);
  });
});
