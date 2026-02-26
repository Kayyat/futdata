const { app, allowedOrigins } = require("./app");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log(`🔒 CORS permitido: ${allowedOrigins.join(", ") || "(nenhum)"}`);
});
