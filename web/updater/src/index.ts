import mqtt from "async-mqtt"
import imagemin from "imagemin"
import puppeteer, { Browser, Page } from "puppeteer"
import imageminPngquant from "imagemin-pngquant"
import Jimp from "jimp"
import fs from "fs/promises"

let browser: Browser | null = null
let page: Page | null = null

const captureBlackWhiteImage = async (url: string): Promise<Buffer> => {
  console.log("Capturing website screenshot...")

  console.time("image")
  console.time("capture")

  const width = 1200
  const height = 825

  if (!browser)
    browser = await puppeteer.launch()
  if (!page) {
    page = await browser.newPage()
    await page.setViewport({
      width: 1200,
      height: 825,
      deviceScaleFactor: 0,
    })
    page
      .on('console', message =>
        console.log(`${message.type().substring(0, 3).toUpperCase()} ${message.text()}`))
      .on('pageerror', ({ message }) => console.log(message))
  }

  await page.goto(url, {
    waitUntil: "networkidle2"
  })
  
  const imageBuffer = Buffer.from(await page.screenshot({
    type: "png",
    clip: {
      x: 0, y: 0, width, height
    },
  }))

  console.timeEnd("capture")

  const img = await Jimp.read(imageBuffer)
  img
    .greyscale()
    .contrast(0.1)
    .normalize()

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
  })
  console.timeEnd("image")

  await fs.writeFile("image.png", minifiedGreyImageBuffer)

  return minifiedGreyImageBuffer
}

const sendImage = async (image: Buffer) => {
  console.log("Connecting to MQTT...")
  const client = await mqtt.connectAsync(process.env.MQTT_URL ?? "", {
    username: process.env.MQTT_USER ?? "",
    password: process.env.MQTT_PASS ?? "",
  })

  if (!client.connected || client.disconnected) throw new Error("Could not connect to MQTT server")

  console.log("MQTT connected!")

  const topic = process.env.MQTT_TOPIC ?? ""
  console.log(`Publishing image ${image.byteLength / 1024} kB on topic '${topic}'`)

  console.time("publish")

  await client.publish(topic, image, { retain: true })

  console.timeEnd("publish")

  await client.end()
}

async function run() {
  const sendImageInterval = 1 * 60_000 // 1 minute
  while (true) {
    const url = `${process.env.WWW_URL}/display`
    console.log(`Making screenshot of '${url}'`);
    const image = await captureBlackWhiteImage(url)
    await sendImage(image)
    const memoryData = process.memoryUsage()
    console.log(`Heap used: ${memoryData.heapUsed}`)
    await new Promise(resolve => setTimeout(resolve, sendImageInterval))
  }
}

run()
