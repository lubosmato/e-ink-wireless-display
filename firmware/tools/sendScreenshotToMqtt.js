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
    // "https://lubosmato.github.io/"
    // "https://www.xmple.com/wallpaper/white-linear-gradient-black-1920x1080-c2-f8f8ff-000000-a-0-f-14.svg"
    // "https://instagram.fprg5-1.fna.fbcdn.net/v/t51.2885-15/224506752_119408683745723_1983715120160793531_n.jpg?stp=dst-jpg_e35&_nc_ht=instagram.fprg5-1.fna.fbcdn.net&_nc_cat=111&_nc_ohc=NIYfrDnldFAAX822E2w&tn=kWCIju5s9PCCr2WD&edm=ALQROFkBAAAA&ccb=7-4&ig_cache_key=MjYyNzI2MzU2OTY0NTAzMDAxMg%3D%3D.2-ccb7-4&oh=00_AT9q1L7TRsMsnWtp6n6-LDaj0IvpmhPYIYj7VzHax4ofkQ&oe=62380BE9&_nc_sid=30a2ef"
    "https://en.cppreference.com/w/cpp/algorithm/fill"
  )

  console.log("Connecting to MQTT...")
  const client = await mqtt.connectAsync("mqtts://grow.lubosmatejcik.cz:8883", {
    username: "user?",
    password: "password?",
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
