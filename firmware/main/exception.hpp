#pragma once

#include "esp_err.h"

#include <array>
#include <exception>

struct Exception : std::runtime_error {
private:
  std::array<char, 64> message{};

public:
  Exception(const std::string& message) : std::runtime_error(message) {
  }

  Exception(esp_err_t errorCode) :
    std::runtime_error(std::string{esp_err_to_name_r(errorCode, message.data(), message.size())}) {
  }

  static void check(esp_err_t errorCode) {
    if (unlikely(errorCode != ESP_OK)) throw Exception(errorCode);
  }
};
