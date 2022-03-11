#pragma once

#include "driver/adc.h"
#include "esp_adc_cal.h"
#include "esp_log.h"

#include <numeric>

const char* TAG_POWER = "power";

struct Power {
  gpio_num_t batteryVoltagePin = GPIO_NUM_36;
  gpio_num_t enable5VPin = GPIO_NUM_21;
  esp_adc_cal_characteristics_t adcChars{};

  Power() {
    gpio_config_t conf{};

    conf.pin_bit_mask = (1 << batteryVoltagePin);
    conf.mode = GPIO_MODE_INPUT;
    conf.pull_up_en = GPIO_PULLUP_DISABLE;
    conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    conf.intr_type = GPIO_INTR_DISABLE;

    gpio_config(&conf);

    conf.pin_bit_mask = (1 << enable5VPin);
    conf.mode = GPIO_MODE_OUTPUT;
    conf.pull_up_en = GPIO_PULLUP_ENABLE;
    conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    conf.intr_type = GPIO_INTR_DISABLE;

    gpio_config(&conf);

    adc_set_data_width(ADC_UNIT_1, ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11);
    constexpr uint32_t defaultVRef = 1100;
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, defaultVRef, &adcChars);

    // TODO how to calibrate ADCs on new boards? should be part of "first run" procedure? how?
  }

  void set5VOutput(bool enable) {
    gpio_set_level(enable5VPin, enable ? 1 : 0);
  }

  static int voltageToCapacity(float voltage) {
    // 100% == 4.2V
    // 20% == 3.73 (but we consider 20% to be a discharge limit so lets make 3.73 volts 0%, see LUT)
    struct LUTElement {
      int capacity;
      float voltageThresh;
    };

    const static std::array<LUTElement, 17> lut{{
      {100, 4.2},
      {93, 4.15},
      {87, 4.11},
      {81, 4.08},
      {75, 4.02},
      {68, 3.98},
      {62, 3.95},
      {56, 3.91},
      {50, 3.87},
      {43, 3.85},
      {37, 3.84},
      {31, 3.82},
      {25, 3.8},
      {18, 3.79},
      {12, 3.77},
      {6, 3.75},
      {0, 3.73},
    }};

    if (voltage >= lut.cbegin()->voltageThresh) return 100;
    if (voltage <= lut.crbegin()->voltageThresh) return 0;

    LUTElement prevLutElement = *lut.cbegin();

    for (const LUTElement& lutElement : lut) {
      const auto [capacity, voltageThresh] = lutElement;

      if (voltage >= voltageThresh) {
        const auto [prevCapacity, prevVoltageThresh] = prevLutElement;

        // linear interpolation between LUT points:
        return static_cast<int>(
          capacity + (voltage - voltageThresh) / (prevVoltageThresh - voltageThresh) * (prevCapacity - capacity));
      }
      prevLutElement = lutElement;
    }

    return 0;
  }

  float readBatteryVoltage() {
    constexpr int numberOfSamples = 2048;

    int sum = 0;
    for (int i = 0; i < numberOfSamples; i++) {
      const int raw = adc1_get_raw(ADC1_CHANNEL_0);
      const int adcVoltage = esp_adc_cal_raw_to_voltage(raw, &adcChars);
      sum += adcVoltage;
    }

    const int average = sum / numberOfSamples;
    const float adcVoltage = average / 1000.0f; // average in [mV]
    constexpr float voltageMultiplier = 2; // NOTE resistor divider 1:1
    float voltage = adcVoltage * voltageMultiplier;

    if (voltage > 4.22) {
      ESP_LOGW(TAG_POWER, "Battery over voltage: %fV", voltage);
    }

    if (voltage < 3.71) {
      ESP_LOGW(TAG_POWER, "Battery under voltage: %fV", voltage);
    }

    return voltage;
  }
};
