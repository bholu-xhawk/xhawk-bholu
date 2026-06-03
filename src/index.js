const { createServer } = require('./server');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

