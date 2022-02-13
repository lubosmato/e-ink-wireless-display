#include "esp_log.h"
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

namespace es = essentials;

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

  es::Esp32Storage mqttStorage{"mqtt"};
  es::Config mqttConfig{mqttStorage};
  es::Config::Value<std::string> mqttUrl = mqttConfig.get<std::string>("url");
  es::Config::Value<std::string> mqttUser = mqttConfig.get<std::string>("user");
  es::Config::Value<std::string> mqttPass = mqttConfig.get<std::string>("pass");

  es::Wifi wifi{};
  std::unique_ptr<es::Mqtt> mqtt{};
  std::vector<std::unique_ptr<es::Mqtt::Subscription>> subs{};

  es::SettingsServer settingsServer{80,
    "My App",
    "1.0.1",
    {
      {"WiFi SSID", ssid},
      {"WiFi Password", wifiPass},
      {"MQTT URL", mqttUrl},
      {"MQTT Username", mqttUser},
      {"MQTT Password", mqttPass},
    }};

  pngle_t* pngle = nullptr;
  bool timedOut = false;
  std::array<uint8_t, 1200 * 10> pixelBuffer{};
  uint32_t currentPixelOffset{};
  uint32_t imageWidth{};
  uint32_t imageHeight{};

  static constexpr uint32_t displayWidth = 1200;
  static constexpr uint32_t displayHeight = 825;

  void run() {
    wifi.connect(*ssid, *wifiPass);

    ESP_LOGI(TAG_APP, "Waiting for wifi connection...");
    int tryCount = 0;
    while (!wifi.isConnected() && tryCount < 1000) {
      tryCount++;
      vTaskDelay(pdMS_TO_TICKS(10));
    }

    settingsServer.start();

    if (!wifi.isConnected()) {
      ESP_LOGW(TAG_APP, "Couldn't connect to the wifi. Starting WiFi AP with settings server.");
      wifi.startAccessPoint("esp32", "12345678", es::Wifi::Channel::Channel5);
      while (true) {
        ESP_LOGI(TAG_APP, "Waiting for configuration...");
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
        ESP_LOGI(TAG_APP, "MQTT is connected!");
        publishStartupDeviceInfo();
      },
      []() { ESP_LOGI(TAG_APP, "MQTT is disconnected!"); },
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
      if (pngle != nullptr) {
        int fedBytes = pngle_feed(pngle, chunk.data.data(), chunk.data.size());
        if (fedBytes < 0) {
          ESP_LOGE(TAG_APP, "pngle error: %s", pngle_error(pngle));
        }
      }

      ESP_LOGI(TAG_APP, "got image data, size: %d", chunk.data.size());

      const auto isLastChunk = chunk.offset + chunk.data.size() == chunk.totalLength;
      if (isLastChunk) {
        const auto elapsedTime = esp_timer_get_time() - startTime;

        ESP_LOGI(TAG_APP, "elapsed time to image download and decode: %lld ms", elapsedTime / 1000);

        // TODO decode image
        // TODO draw image

        pngle_destroy(pngle);
        pngle = nullptr;

        timedOut = false;
        goToSleep();
      }
    }));

    // 15s timeout for sleeping
    vTaskDelay(pdMS_TO_TICKS(1500));
    timedOut = true;
    goToSleep();
  }

  void setImageDimension(uint32_t w, uint32_t h) {
    imageWidth = w;
    imageHeight = h;
  }

  void drawPixel(uint32_t x, uint32_t y, uint32_t w, uint32_t h, uint8_t rgba[4]) {
    uint32_t pixelIndex = y * imageWidth + x - currentPixelOffset;
    if (pixelIndex >= pixelBuffer.size()) {
      flushPixelBuffer();

      currentPixelOffset += pixelBuffer.size();
      pixelIndex = y * imageWidth + x - currentPixelOffset;
    }
    // TODO put two pixels into one pixel buffer element (one pixel has 4 bits) - IT8951 packed pixel data transfer
    // since the display is greyscale, we only need one color (incoming image is grayscale)
    pixelBuffer[pixelIndex] = rgba[0];
  }

  void flushPixelBuffer() {
    printf("flushing pixel buffer %d\n", currentPixelOffset);
    // TODO
    if (pixelBuffer.size() + currentPixelOffset > imageWidth * imageHeight) {
      drawDisplay();
    }
  }

  void drawDisplay() {
    printf("drawing display\n");
    // TODO
  }

  void publishStartupDeviceInfo() {
    mqtt->publish("info/startup/freeHeap", deviceInfo.freeHeap(), es::Mqtt::Qos::Qos0, false);
    mqtt->publish("info/startup/totalHeap", deviceInfo.totalHeap(), es::Mqtt::Qos::Qos0, false);
    // elapsed time before connecting to MQTT
    mqtt->publish("info/startup/time", deviceInfo.uptime(), es::Mqtt::Qos::Qos0, false);
  }

  void goToSleep() {
    publishAfterDeviceInfo();
    // TODO wait for mqtt publish finish (in publishAfterDeviceInfo) instead of sleep 500ms
    vTaskDelay(pdMS_TO_TICKS(500));

    ESP_LOGI(TAG_APP, "Good night, going to sleep...");
    esp_sleep_enable_timer_wakeup(5 * 1000 * 1000);
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
    ESP_LOGE(TAG_APP, "EXCEPTION: %s", e.what());
  } catch (...) {
    ESP_LOGE(TAG_APP, "UNKNOWN EXCEPTION");
  }
  esp_restart();
}
