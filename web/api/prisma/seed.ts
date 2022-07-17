async function seedDatabase() {
  console.log(`Seeding...`)

  // ...

  console.log(`Finished`)
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(-1)
  })
