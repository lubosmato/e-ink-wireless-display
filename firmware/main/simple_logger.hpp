#pragma once

#include "esp_log.h"

#include <array>
#include <string_view>

#define ALLOW_UNUSED(x) (void)(x)

constexpr esp_log_level_t verbosity = ESP_LOG_WARN;

constexpr std::array<std::string_view, 6> logLevelToColor = {{
  "", // none
  "\033[91m", // red
  "\033[93m", // yellow
  "\033[92m", // green
  "\033[0m", // white
  "\033[90m", // gray
}};
constexpr std::string_view colorReset = "\033[0m\n";
constexpr std::array<char, 6> levelToLetter{'?', 'E', 'W', 'I', 'D', 'V'};

template<esp_log_level_t level, typename... Args>
void log(const char* tag, const char* format, Args&&... args) {
  ALLOW_UNUSED(tag);
  ALLOW_UNUSED(format);

  if constexpr (level <= verbosity) {
    std::string coloredFormat = std::string{logLevelToColor[level]};
    coloredFormat += "%c (%d) %s: ";
    coloredFormat += format;
    coloredFormat += colorReset;

    esp_log_write(
      level, tag, coloredFormat.c_str(), levelToLetter[level], esp_log_timestamp(), tag, std::forward<Args>(args)...);
  }
}

template<typename... Args>
void logV(const char* tag, const char* format, Args&&... args) {
  log<ESP_LOG_VERBOSE>(tag, format, std::forward<Args>(args)...);
}

template<typename... Args>
void logD(const char* tag, const char* format, Args&&... args) {
  log<ESP_LOG_DEBUG>(tag, format, std::forward<Args>(args)...);
}

template<typename... Args>
void logI(const char* tag, const char* format, Args&&... args) {
  log<ESP_LOG_INFO>(tag, format, std::forward<Args>(args)...);
}

template<typename... Args>
void logW(const char* tag, const char* format, Args&&... args) {
  log<ESP_LOG_WARN>(tag, format, std::forward<Args>(args)...);
}

template<typename... Args>
void logE(const char* tag, const char* format, Args&&... args) {
  log<ESP_LOG_ERROR>(tag, format, std::forward<Args>(args)...);
}
