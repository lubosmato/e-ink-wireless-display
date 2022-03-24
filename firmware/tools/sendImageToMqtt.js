import mqtt from "async-mqtt"
import fs from "fs"

const image = fs.readFileSync("interlaced8-passes-test-with-pngle.png")

const sendImage = async () => {
  console.log("Connecting to MQTT...")
  const client = await mqtt.connectAsync("mqtts://grow.lubosmatejcik.cz:8883", {
    username: "esp32",
    password: "65G@j!74Cfg6%$sR8x", // whoops :)
  })

  if (!client.connected || client.disconnected) throw new Error("Could not connect to MQTT server")
  
  console.log("Connected!")

  const topic = "esp32/6037cc/image"
  console.log(`Publishing image ${image.byteLength / 1024} kB on topic '${topic}`)

  console.time("publish")

  await client.publish(topic, image, {retain: true})
  
  console.timeEnd("publish")

  await client.end()

  console.log("Done!")
  process.exit(0)
}

sendImage()
