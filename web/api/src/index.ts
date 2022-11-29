import { server } from "./server"

const port = parseInt(process.env.API_PORT ?? "4000")

server.listen(port, "0.0.0.0", () => {
  console.info(`Server is running port ${port}/`)
})
