import { createApp } from './server.js'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001
const app = createApp()

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
