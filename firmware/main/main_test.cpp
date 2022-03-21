#include "driver/dac.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "power.hpp"
#include "simple_logger.hpp"

#include <algorithm>
#include <chrono>

using namespace std::chrono_literals;

const char* TAG_APP = "app";

struct App {
  esp_adc_cal_characteristics_t adcChars{};

  void run() {
    gpio_num_t batteryVoltagePin = GPIO_NUM_36;
    gpio_config_t conf{};

    conf.pin_bit_mask = (1ull << batteryVoltagePin);
    conf.mode = GPIO_MODE_INPUT;
    conf.pull_up_en = GPIO_PULLUP_DISABLE;
    conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    conf.intr_type = GPIO_INTR_DISABLE;

    gpio_config(&conf);

    adc_set_data_width(ADC_UNIT_1, ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11);
    constexpr uint32_t defaultVRef = 1100;
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, defaultVRef, &adcChars);

    xTaskCreate(
      [](void*) {
        fflush(stdin);

        dac_output_enable(DAC_CHANNEL_1);
        uint8_t rawDac = 144;
        dac_output_voltage(DAC_CHANNEL_1, rawDac);

        while (true) {
          uint8_t ch = fgetc(stdin);
          if (ch != 0xFF) {
            rawDac++;
            dac_output_voltage(DAC_CHANNEL_1, rawDac);
            logI(TAG_APP, "DAC: %d", rawDac);
          }
          vTaskDelay(pdMS_TO_TICKS(1000));
        }
      },
      "dacTask",
      2048,
      nullptr,
      tskIDLE_PRIORITY,
      nullptr);

    while (true) {
      float v = readAdcVoltage();
      logI(TAG_APP, "Voltage %f mV", v * 1000);
      vTaskDelay(pdMS_TO_TICKS(10));
    }
  }

  float readAdcVoltage() const {
    constexpr int numberOfSamples = 1 << 14;

    int sum = 0;
    for (int i = 0; i < numberOfSamples; i++) {
      sum += esp_adc_cal_raw_to_voltage(adc1_get_raw(ADC1_CHANNEL_0), &adcChars);
    }
    const int average = sum / numberOfSamples;
    const float adcVoltage = average / 1000.0f; // average in [mV]

    /*
        if (voltage > 4.22) {
          logW(TAG_POWER, "Battery over voltage: %fV", voltage);
        }

        if (voltage < 3.71) {
          logW(TAG_POWER, "Battery under voltage: %fV", voltage);
        }
    */
    return adcVoltage;
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
