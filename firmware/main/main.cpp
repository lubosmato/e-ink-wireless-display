#include "dma_buffer.hpp"
#include "esp_sleep.h"
#include "essentials/config.hpp"
#include "essentials/device_info.hpp"
#include "essentials/esp32_storage.hpp"
#include "essentials/mqtt.hpp"
#include "essentials/settings_server.hpp"
#include "essentials/wifi.hpp"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "pngle/pngle.h"
#include "power.hpp"
#include "simple_logger.hpp"
#include "waveshare_it8951.hpp"

#include <algorithm>
#include <chrono>

namespace es = essentials;
using namespace std::chrono_literals;

const char* TAG_APP = "app";

extern const uint8_t mqttCertBegin[] asm("_binary_cert_pem_start");
extern const uint8_t mqttCertEnd[] asm("_binary_cert_pem_end");

struct App {
  const int64_t startTime = esp_timer_get_time();
  es::DeviceInfo deviceInfo{};

  es::Esp32Storage configStorage{"config"};
  es::Config config{configStorage};
  es::Config::Value<std::string> ssid = config.get<std::string>("ssid");
  es::Config::Value<std::string> wifiPass = config.get<std::string>("wifiPass");
  es::Config::Value<std::string> vComDefault = config.get<std::string>("vcom", "-1.8");
  es::Config::Value<std::string> adcCalibA = config.get<std::string>("adcA", "49505");
  es::Config::Value<std::string> adcCalibB = config.get<std::string>("adcB", "269");

  es::Esp32Storage mqttStorage{"mqtt"};
  es::Config mqttConfig{mqttStorage};
  es::Config::Value<std::string> mqttUrl = mqttConfig.get<std::string>("url", "mqtt://127.0.0.1:1883");
  es::Config::Value<std::string> mqttUser = mqttConfig.get<std::string>("user", "");
  es::Config::Value<std::string> mqttPass = mqttConfig.get<std::string>("pass", "");

  es::Wifi wifi{};
  std::unique_ptr<es::Mqtt> mqtt{};
  std::vector<std::unique_ptr<es::Mqtt::Subscription>> subs{};
  Power power{adcCalibA, adcCalibB};
  float batteryVoltage{};
  uint32_t batteryRaw{};

  es::SettingsServer settingsServer{80,
    "Wireless E-Ink",
    "1.0.1",
    {
      {"WiFi SSID", ssid},
      {"WiFi Password", wifiPass},
      {"MQTT URL", mqttUrl},
      {"MQTT Username", mqttUser},
      {"MQTT Password", mqttPass},
      {"VCom", vComDefault},
      {"ADC calib A", adcCalibA},
      {"ADC calib B", adcCalibB},
    }};

  pngle_t* pngle = nullptr;
  bool timedOut = false;
  WaveshareIT8951 display{WaveshareIT8951::Pins{}, power};
  DmaBuffer& pixelBuffer{display.pixelBuffer()};
  uint32_t currentBufferOffset{};
  uint32_t imageWidth{};
  uint32_t imageHeight{};
  float vcom{};

  static constexpr uint32_t pixelsToByteRatio = 2; // 4 bits per pixel (2 pixels : 1 buffer byte)
  static constexpr uint16_t displayWidth = 1200;
  static constexpr uint16_t displayHeight = 825;

  static constexpr auto sleepTime = 60s;

  void run() {
    checkBattery();

    vcom = std::atof((*vComDefault).c_str());

    display.powerUp();
    wifi.connect(*ssid, *wifiPass);

    logW(TAG_APP, "VCom %f", vcom);
    display.connect(vcom);

    logW(TAG_APP, "Waiting for wifi connection...");
    int tryCount = 0;
    while (!wifi.isConnected() && tryCount < 1000) {
      tryCount++;
      vTaskDelay(pdMS_TO_TICKS(10));
    }

    auto info = display.info();
    logW(TAG_APP,
      "Display: width %d, height %d, addr H %d, addr L %d, FW ver %s, LUT ver %s",
      info.width,
      info.height,
      info.bufferAddressH,
      info.bufferAddressL,
      info.fwVersion,
      info.lutVersion);

    settingsServer.start();

    if (!wifi.isConnected()) {
      logE(TAG_APP, "Couldn't connect to the wifi. Starting WiFi AP with settings server.");
      wifi.startAccessPoint("esp32", "12345678", es::Wifi::Channel::Channel5);
      while (true) {
        logW(TAG_APP, "Waiting for configuration...");
        vTaskDelay(pdMS_TO_TICKS(1000));
      }
    }

    auto mqttCert =
      std::string_view{reinterpret_cast<const char*>(mqttCertBegin), std::size_t(mqttCertEnd - mqttCertBegin)};
    std::string mqttPrefix = "esp32/" + deviceInfo.uniqueId();

    std::string url = *mqttUrl;
    std::string user = *mqttUser;
    std::string pass = *mqttPass;
    es::Mqtt::ConnectionInfo mqttInfo{url, mqttCert, user, pass};
    es::Mqtt::LastWillMessage lastWill{"last/will", "Bye", es::Mqtt::Qos::Qos0, false};

    mqtt = std::make_unique<es::Mqtt>(
      mqttInfo,
      std::string_view{mqttPrefix},
      std::chrono::seconds{30},
      lastWill,
      [this]() {
        logI(TAG_APP, "MQTT is connected!");
        publishStartupDeviceInfo();
      },
      []() { logI(TAG_APP, "MQTT is disconnected!"); },
      1024 * 30);

    pngle = pngle_new();
    pngle_set_user_data(pngle, this);

    pngle_set_init_callback(pngle, [](pngle_t* pngle, uint32_t w, uint32_t h) {
      auto app = static_cast<App*>(pngle_get_user_data(pngle));
      app->setImageDimension(w, h);
    });

    pngle_set_draw_callback(pngle, [](pngle_t* pngle, uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint8_t rgba[4]) {
      auto app = static_cast<App*>(pngle_get_user_data(pngle));
      app->drawPixel(x, y, w, h, rgba);
    });

    subs.emplace_back(mqtt->subscribe("image", es::Mqtt::Qos::Qos0, [this](const es::Mqtt::Data& chunk) {
      logI(TAG_APP, "got image data, size: %d", chunk.data.size());

      if (pngle != nullptr) {
        int fedBytes = pngle_feed(pngle, chunk.data.data(), chunk.data.size());
        if (fedBytes < 0) {
          logE(TAG_APP, "pngle error: %s", pngle_error(pngle));
        }
      }

      const auto isLastChunk = chunk.offset + chunk.data.size() == chunk.totalLength;
      if (isLastChunk) {
        const auto elapsedTime = esp_timer_get_time() - startTime;
        logI(TAG_APP, "elapsed time to image download and decode: %lld ms", elapsedTime / 1000);

        pngle_destroy(pngle);
        pngle = nullptr;

        timedOut = false;
        goToSleep();
      }
    }));

    // subscribe to "ping" topic and react to it by sending "pong" message back
    subs.emplace_back(mqtt->subscribe("ping", es::Mqtt::Qos::Qos0, [this](const es::Mqtt::Data& chunk) {
      logI(TAG_APP, "got ping message");
      mqtt->publish("pong", chunk.data, es::Mqtt::Qos::Qos0, false);
    }));

    // 20s timeout for sleeping
    vTaskDelay(pdMS_TO_TICKS(20000));
    timedOut = true;
    goToSleep();
  }

  void checkBattery() {
    auto [v, raw] = power.readBatteryVoltage();
    batteryVoltage = v;
    batteryRaw = raw;

    const int capacity = power.voltageToCapacity(batteryVoltage);
    logW(TAG_APP, "Battery capacity %d%%", capacity);

    if (capacity < 20) {
      logE(TAG_APP, "Battery capacity at 20%%. Going to sleep...");
      esp_sleep_enable_timer_wakeup(std::chrono::microseconds{sleepTime}.count());
      esp_deep_sleep_start();
    }
  }

  void setImageDimension(uint32_t w, uint32_t h) {
    imageWidth = w;
    imageHeight = h;
  }

  void drawPixel(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint8_t rgba[4]) {
    uint32_t pixelIndex = y * imageWidth + x;
    uint32_t bufferIndex = pixelIndex / pixelsToByteRatio - currentBufferOffset;

    if (bufferIndex >= pixelBuffer.size()) {
      flushPixelBuffer();

      currentBufferOffset += pixelBuffer.size();
      bufferIndex = pixelIndex / pixelsToByteRatio - currentBufferOffset;
    }

    // NOTE since the display is greyscale, we only need one color (incoming image is/should be grayscale)
    if ((pixelIndex % 2) == 0) {
      pixelBuffer[bufferIndex] = (rgba[0] & 0xf0);
    } else {
      pixelBuffer[bufferIndex] |= (rgba[0] & 0xf0) >> 4;
    }

    if (pixelIndex == imageWidth * imageHeight - 1) {
      flushPixelBuffer();
      drawDisplay();
    }
  }

  void flushPixelBuffer() {
    // NOTE this code heavily rely on having buffer size multiply of image size
    logI(TAG_APP, "flushing pixel buffer %d", currentBufferOffset);

    const uint32_t pixelOffset = currentBufferOffset * pixelsToByteRatio;

    const uint16_t x = pixelOffset % displayWidth;
    const uint16_t y = pixelOffset / displayWidth;

    const uint16_t width = displayWidth;
    const uint16_t height = (pixelBuffer.size() * pixelsToByteRatio) / displayWidth;

    display.sendImage(x, y, width, height);
  }

  void drawDisplay() {
    logW(TAG_APP, "drawing display");

    uint16_t capacity = ((power.voltageToCapacity(batteryVoltage) - 20) * 7) / 5; // random visualisation adjustment

    capacity = (capacity / 10) * 10; // remove units
    drawBattery(displayWidth - 16, displayHeight - 16, capacity);

    display.showImage(0, 0, displayWidth, displayHeight);
    display.disconnect();
  }

  void drawBattery(int startX, int startY, int capacity) {
    std::fill(pixelBuffer.begin(), pixelBuffer.end(), 0xff);

    constexpr uint16_t iconWidth = 16;
    constexpr uint16_t iconHeight = 16;

    constexpr uint16_t batteryHeight = (iconHeight * 90) / 100; // 90% (5% vertical margin)
    constexpr uint16_t topNotchHeight = (iconHeight * 20) / 100; // 10%
    constexpr uint16_t batteryThickness = (iconWidth * 50) / 100; // 50%

    for (int y = (iconHeight - batteryHeight) / 2; y <= (iconHeight - batteryHeight) / 2 + topNotchHeight; y++) {
      for (int x = (iconWidth - (batteryThickness / 2)) / 2;
           x <= (iconWidth - (batteryThickness / 2)) / 2 + (batteryThickness / 2);
           x++) {
        uint32_t pixelIndex = y * iconWidth + x;
        uint32_t bufferIndex = pixelIndex / pixelsToByteRatio;

        pixelBuffer[bufferIndex] = 0x00;
      }
    }

    for (int y = (iconHeight - batteryHeight + topNotchHeight) / 2;
         y <= (iconHeight - batteryHeight) / 2 + batteryHeight;
         y++) {
      for (int x = (iconWidth - batteryThickness) / 2; x <= (iconWidth - batteryThickness) / 2 + batteryThickness;
           x++) {
        uint32_t pixelIndex = y * iconWidth + x;
        uint32_t bufferIndex = pixelIndex / pixelsToByteRatio;

        uint8_t color = 0x0f;

        float relativeY = 1.0f - (y - (iconHeight - batteryHeight + topNotchHeight) / 2.0f) / batteryHeight;

        if (relativeY * 100 < capacity) {
          color = 0x00;
        }

        const bool isVerticalBorder = y == (iconHeight - batteryHeight + topNotchHeight) / 2 ||
          y == (iconHeight - batteryHeight) / 2 + batteryHeight;
        const bool isHorizontalBorder = ((pixelIndex % 2 == 0) && x == (iconWidth - batteryThickness) / 2) ||
          ((pixelIndex % 2 == 1) && x == (iconWidth - batteryThickness) / 2 + batteryThickness);

        const bool isBorder = isVerticalBorder || isHorizontalBorder;

        if (isBorder) color = 0x00;

        if ((pixelIndex % 2) == 0) {
          pixelBuffer[bufferIndex] = (color & 0x0f) << 4;
        } else {
          pixelBuffer[bufferIndex] |= (color & 0x0f);
        }
      }
    }

    display.sendImage(startX, startY, iconWidth, iconHeight);
  }

  void publishStartupDeviceInfo() {
    const auto rssi = wifi.rssi();
    if (rssi) mqtt->publish("info/startup/rssi", *rssi, es::Mqtt::Qos::Qos0, false);

    mqtt->publish("info/startup/freeHeap", deviceInfo.freeHeap(), es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/startup/totalHeap", deviceInfo.totalHeap(), es::Mqtt::Qos::Qos0, false);
    // elapsed time before connecting to MQTT
    mqtt->publish("info/startup/time", deviceInfo.uptime(), es::Mqtt::Qos::Qos0, false);

    mqtt->publish("info/startup/batteryRaw", batteryRaw, es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/startup/batteryVoltage", batteryVoltage, es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/startup/batteryCapacity", power.voltageToCapacity(batteryVoltage), es::Mqtt::Qos::Qos0, false);
  }

  void goToSleep() {
    publishAfterDeviceInfo();
    // TODO wait for mqtt publish finish (in publishAfterDeviceInfo) instead of sleep 500ms
    vTaskDelay(pdMS_TO_TICKS(500));

    if (timedOut) {
      logE(TAG_APP, "Tímed out!");
    }
    logW(TAG_APP, "Good night, going to sleep...");
    esp_sleep_enable_timer_wakeup(std::chrono::microseconds{sleepTime}.count());
    esp_deep_sleep_start();
  }

  void publishAfterDeviceInfo() {
    mqtt->publish("info/timedOut", timedOut, es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/finish/freeHeap", deviceInfo.freeHeap(), es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/finish/totalHeap", deviceInfo.totalHeap(), es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/finish/totalTime", deviceInfo.uptime(), es::Mqtt::Qos::Qos0, false);
  }
};

extern "C" void app_main() {
  try {
    App{}.run();
  } catch (const std::exception& e) {
    logE(TAG_APP, "EXCEPTION: %s", e.what());
  } catch (...) {
    logE(TAG_APP, "UNKNOWN EXCEPTION");
  }
  esp_restart();
}
