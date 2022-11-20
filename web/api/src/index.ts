import { server } from "./server"

const port = process.env.API_PORT ?? "4000"

server.listen(port, () => {
  console.info(`Server is running on http://localhost:${port}/`)
})
