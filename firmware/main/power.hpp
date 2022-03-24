#pragma once

#include "driver/adc.h"
#include "esp_adc_cal.h"
#include "simple_logger.hpp"

#include <array>
#include <numeric>
#include <tuple>

static const char* TAG_POWER = "power";

struct Power {
  gpio_num_t batteryVoltagePin = GPIO_NUM_36;
  gpio_num_t enable5VPin = GPIO_NUM_21;
  esp_adc_cal_characteristics_t adcChars{};

  Power() {
    gpio_config_t conf{};

    conf.pin_bit_mask = (1ull << batteryVoltagePin);
    conf.mode = GPIO_MODE_INPUT;
    conf.pull_up_en = GPIO_PULLUP_DISABLE;
    conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&conf);

    conf.pin_bit_mask = (1ull << enable5VPin);
    conf.mode = GPIO_MODE_OUTPUT;
    conf.pull_up_en = GPIO_PULLUP_ENABLE;
    conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&conf);

    conf.pin_bit_mask = (1ull << GPIO_NUM_32); // sensor VP
    conf.mode = GPIO_MODE_INPUT;
    conf.pull_up_en = GPIO_PULLUP_DISABLE;
    conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&conf);

    adc_set_data_width(ADC_UNIT_1, ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11);
    constexpr uint32_t defaultVRef = 1100;
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, defaultVRef, &adcChars);

    // TODO use custom calibration values (manufacture's efuse values are inaccurate)
    // adcChars.coeff_a = 56000;
    // adcChars.coeff_b = 72;
    adcChars.coeff_a = 49505;
    adcChars.coeff_b = 269;
    // corrected voltage = (sample * coeff_a) / 65536 + coeff_b

    // Vmet ADC
    // 1810 1871
    // 1820 1884
    // 1835 1889
    // 1845 1905
    // 1860 1906
    // 1870 1926
    // 1880 1958
    // 1910 1975
    // 2016 2009
    // 2010 2073
    // 2055 2093

    /* RAW ADC | Volt meter

    1870 1675
    1927 1725
    1978 1770
    2017 1800 ? (maybe vice versa?)
    2281 1975
    2359 2035
    2365 2060
    2367 2080
    2367 2080
    2367 2080
    2367 2080
    2367 2080
    2367 2080
    */
  }

  void set5VOutput(bool enable) const {
    gpio_set_level(enable5VPin, enable ? 1 : 0);
  }

  bool get5VOutput() const {
    return gpio_get_level(enable5VPin) == 1;
  }

  static int voltageToCapacity(float voltage) {
    struct LUTElement {
      int capacity;
      float voltageThresh;
    };

    const static std::array<LUTElement, 21> lut{{
      {100, 4.2},
      {95, 4.15},
      {90, 4.11},
      {85, 4.08},
      {80, 4.02},
      {75, 3.98},
      {70, 3.95},
      {65, 3.91},
      {60, 3.87},
      {55, 3.85},
      {50, 3.84},
      {45, 3.82},
      {40, 3.8},
      {35, 3.79},
      {30, 3.77},
      {25, 3.75},
      {20, 3.73},
      {15, 3.71},
      {10, 3.69},
      {5, 3.61},
      {0, 3.27},
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

  std::tuple<float, uint32_t> readBatteryVoltage() const {
    constexpr int numberOfSamples = 2048;

    int rawSum = 0;
    int sum = 0;
    for (int i = 0; i < numberOfSamples; i++) {
      int raw = adc1_get_raw(ADC1_CHANNEL_0);
      rawSum += raw;
      sum += esp_adc_cal_raw_to_voltage(raw, &adcChars);
    }
    const int average = sum / numberOfSamples;

    logW(TAG_POWER, "raw %d mV", rawSum / numberOfSamples);
    logW(TAG_POWER, "corrected %d mV", average);

    const float adcVoltage = average / 1000.0f; // average in [mV]
    constexpr float voltageMultiplier = 2; // NOTE resistor divider 1:1
    float voltage = adcVoltage * voltageMultiplier;

    if (voltage > 4.22) {
      logE(TAG_POWER, "Battery over voltage: %fV", voltage);
    }

    if (voltage < 3.71) {
      logE(TAG_POWER, "Battery under voltage: %fV", voltage);
    }

    return {voltage, rawSum};
  }
};
