import mqtt from "async-mqtt"
import fs from "fs"
import captureWebsite from "capture-website"
import Jimp from "jimp"
import imagemin from "imagemin"
import imageminPngquant from "imagemin-pngquant"

const captureBlackWhiteImage = async (url) => {
  console.log("Capturing website screenshot...")

  console.time("image")
  console.time("capture")
  const imageBuffer = await captureWebsite.buffer(
    url,
    {
      width: 1200, 
      height: 825, 
      overwrite: true,
      scaleFactor: 0,
      darkMode: false,
    }
  )
  console.timeEnd("capture")

  const img = await Jimp.read(imageBuffer)
  img
    .greyscale()

  const greyImageBuffer = await img.getBufferAsync(Jimp.MIME_PNG)
  const minifiedGreyImageBuffer = await imagemin.buffer(
    greyImageBuffer, {
      plugins: [
        imageminPngquant({
          // TODO play with these params and get feedback from display (look and change, maximize quality)
          quality: [0.0, 1.0],
          strip: true,
          posterize: 4,
          dithering: false,
        })
      ]
    }
  )
  console.timeEnd("image")
  
  fs.writeFileSync("output.png", minifiedGreyImageBuffer)
  
  return minifiedGreyImageBuffer
}

const sendImage = async () => {
  const image = await captureBlackWhiteImage(
    // "https://cdn.dribbble.com/users/2367559/screenshots/14096604/weather_dashboard_app_thumb_4x.png"
    "https://lubosmato.github.io/"
  )

  console.log("Connecting to MQTT...")
  const client = await mqtt.connectAsync("mqtts://drawboard.lubosmatejcik.cz:8883", {
    username: "esp32-mqtt",
    password: "esp32-pass",
  })

  if (!client.connected || client.disconnected) throw new Error("Could not connect to MQTT server")
  
  console.log("MQTT connected!")

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
