import server from "./server"

const port = process.env.API_PORT || 4000

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url} on port ${port}`)
})
