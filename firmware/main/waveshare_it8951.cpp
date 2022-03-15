#include "waveshare_it8951.hpp"

#include "exception.hpp"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include <algorithm>
#include <cstring>

constexpr int pixelDmaBufferSize = 1200 * 25; // NOTE usable only for 9.7" display (1200x825)
constexpr int generalDmaBufferSize = 256;

WaveshareIT8951::WaveshareIT8951(const Pins& pinConfig, const Power& power) :
  _generalDmaBuffer{make_dma_buffer<generalDmaBufferSize>()},
  _pixelDmaBuffer{make_dma_buffer<pixelDmaBufferSize>()},
  _selectedBuffer{&_generalDmaBuffer},
  _pinConfig{pinConfig},
  _power{power} {
  gpio_set_direction(_pinConfig.rst, GPIO_MODE_OUTPUT);
  gpio_set_level(_pinConfig.rst, 1);
  gpio_set_direction(_pinConfig.hrdy, GPIO_MODE_INPUT);

  spi_bus_config_t busConfig{};

  busConfig.miso_io_num = _pinConfig.miso;
  busConfig.mosi_io_num = _pinConfig.mosi;
  busConfig.sclk_io_num = _pinConfig.sck;
  busConfig.quadwp_io_num = -1;
  busConfig.quadhd_io_num = -1;
  busConfig.max_transfer_sz = _pixelDmaBuffer.size();
  busConfig.flags = SPICOMMON_BUSFLAG_MASTER;

  spi_device_interface_config_t devConfig{};

  devConfig.clock_speed_hz = 8'000'000;
  devConfig.input_delay_ns = 100;
  devConfig.mode = 0;
  devConfig.spics_io_num = _pinConfig.cs;
  devConfig.queue_size = 1;
  devConfig.pre_cb = nullptr;
  devConfig.flags = 0;

  Exception::check(spi_bus_initialize(SPI3_HOST, &busConfig, SPI_DMA_CH_AUTO));
  Exception::check(spi_bus_add_device(SPI3_HOST, &devConfig, &_spi));

  Exception::check(spi_device_acquire_bus(_spi, portMAX_DELAY));
}

void WaveshareIT8951::disconnect() {
  waitForDisplayImage();

  spi_bus_remove_device(_spi);
  spi_bus_free(SPI3_HOST);

  gpio_set_level(_pinConfig.rst, 0);
  gpio_set_level(_pinConfig.hrdy, 0);

  gpio_set_level(_pinConfig.miso, 0);
  gpio_set_level(_pinConfig.mosi, 0);
  gpio_set_level(_pinConfig.sck, 0);
  gpio_set_level(_pinConfig.cs, 0);

  _power.set5VOutput(false);
}

void WaveshareIT8951::waitForDisplayImage() {
  constexpr int timeout = 5000;
  for (int i = 0; i < timeout / 10; i++) {
    if (readRegister(Register::LUTAFSR) == 0) break;
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

void WaveshareIT8951::powerUp() {
  _power.set5VOutput(true);
  vTaskDelay(pdMS_TO_TICKS(100)); // TODO check what time is ok with DC/DC converter?

  gpio_set_level(_pinConfig.rst, 0);
  vTaskDelay(pdMS_TO_TICKS(10));
  gpio_set_level(_pinConfig.rst, 1);
  vTaskDelay(pdMS_TO_TICKS(10));
}

void WaveshareIT8951::connect(float vcom) {
  if (!_power.get5VOutput()) {
    powerUp();
  }

  readDeviceInfo();

  writeRegister(Register::I80CPCR, 0x0001);
  writeRegister(Register::LISAR_H, _info.bufferAddressH);
  writeRegister(Register::LISAR_L, _info.bufferAddressL);

  writeVCom(vcom); // VCom controls brightness (somehow)
}

float WaveshareIT8951::readVCom() {
  sendCommand(Command::VCOM);
  writeData(uint16_t{0});
  auto data = readBytes(2).data;
  float voltage = __builtin_bswap16(*reinterpret_cast<const uint16_t*>(data)) / -1000.0f;

  return voltage;
}

void WaveshareIT8951::writeVCom(float voltage) {
  sendCommand(Command::VCOM);
  writeData(uint16_t{1});
  uint16_t rawVoltage = voltage * -1000;
  writeData(rawVoltage);
}

WaveshareIT8951::Info WaveshareIT8951::info() const {
  return _info;
}

DmaBuffer& WaveshareIT8951::pixelBuffer() {
  return _pixelDmaBuffer;
}

void WaveshareIT8951::waitForReady(int timeout /* = defaultReadyTimeout*/) {
  timeout /= 10;

  if (timeout <= 0) {
    if (gpio_get_level(_pinConfig.hrdy) == 0) throw Exception("Wait for ready timed out");
    return;
  }

  for (int i = 0; i < timeout; i++) {
    if (gpio_get_level(_pinConfig.hrdy) == 1) return;

    vTaskDelay(pdMS_TO_TICKS(10));
  }
  throw Exception("Wait for ready timed out");
}

void WaveshareIT8951::readDeviceInfo() {
  sendCommand(Command::GET_DEV_INFO);
  auto infoData = readBytes(sizeof(Info));

  _info = *reinterpret_cast<const Info*>(infoData.data);
  _info.width = __builtin_bswap16(_info.width);
  _info.height = __builtin_bswap16(_info.height);
  _info.bufferAddressH = __builtin_bswap16(_info.bufferAddressH);
  _info.bufferAddressL = __builtin_bswap16(_info.bufferAddressL);
}

void WaveshareIT8951::sendCommand(Command command) {
  waitForReady();

  performTransaction(true, 0, Operation::COMMAND);
  waitForReady();
  performTransaction(false, 0, command);
  waitForReady();
}

essentials::Span<uint8_t> WaveshareIT8951::readBytes(int readSize) {
  waitForReady();

  performTransaction(true, 0, Operation::READ);
  waitForReady();
  performTransaction(true, 0, uint16_t{0});
  waitForReady();

  return performTransaction(false, readSize);
}

void WaveshareIT8951::writePixelBuffer(int writeSize) {
  waitForReady();

  performTransaction(true, 0, Operation::WRITE);
  waitForReady();

  _selectedBuffer = &_pixelDmaBuffer;
  performBufferTransaction(false, 0, writeSize);
  _selectedBuffer = &_generalDmaBuffer;
}

void WaveshareIT8951::writePattern(uint8_t pattern, int writeSize) {
  waitForReady();

  performTransaction(true, 0, Operation::WRITE);
  waitForReady();

  _selectedBuffer = &_pixelDmaBuffer;
  clearBuffer(0, -1, pattern);

  int repeatCount = writeSize / _selectedBuffer->size();
  int restSize = writeSize % _selectedBuffer->size();

  if (restSize != 0) {
    performBufferTransaction(true, 0, restSize);
  }

  for (int i = 0; i < repeatCount; i++) {
    performBufferTransaction(i != repeatCount - 1, 0, _selectedBuffer->size());
    // NOTE last transaction deactivate CS
  }

  _selectedBuffer = &_generalDmaBuffer;
}

void WaveshareIT8951::writeRegister(Register reg, uint16_t value) {
  sendCommand(Command::REG_WR);
  writeData(reg, value);
}

uint16_t WaveshareIT8951::readRegister(Register reg) {
  sendCommand(Command::REG_RD);
  writeData(reg);

  auto data = readBytes(2).data;
  return __builtin_bswap16(*reinterpret_cast<const uint16_t*>(data));
}

void WaveshareIT8951::sendImage(uint16_t x, uint16_t y, uint16_t width, uint16_t height) {
  sendCommand(Command::LD_IMG_AREA);

  constexpr uint16_t endian = 1; // little = 0, big = 1
  constexpr uint16_t bpp = 2; // bpp2 = 0, bpp3 = 1, bpp4 = 2, bpp8 = 3
  constexpr uint16_t rotation = 0; // 0° = 0, 90° = 1, 180° = 2, 270° = 3
  constexpr uint16_t config = (endian << 8) | (bpp << 4) | rotation;

  writeData(config, x, y, width, height);
  writePixelBuffer(width * height / 2);
  sendCommand(Command::LD_IMG_END);
}

void WaveshareIT8951::showImage(uint16_t x, uint16_t y, uint16_t width, uint16_t height) {
  sendCommand(Command::DPY_BUF_AREA);
  writeData(x, y, width, height, uint16_t{0}, _info.bufferAddressL, _info.bufferAddressH);
  waitForDisplayImage();

  sendCommand(Command::DPY_BUF_AREA);
  // mode is undocumented magic number but:
  // 0 = fill screen with white
  // 2 = use (somehow) greyscale
  // 5 = who knows? but it works
  constexpr uint16_t mode = 5;
  writeData(x, y, width, height, mode, _info.bufferAddressL, _info.bufferAddressH);
  waitForDisplayImage();
}

void WaveshareIT8951::clear() {
  sendCommand(Command::LD_IMG_AREA);

  constexpr uint16_t endian = 0; // little
  constexpr uint16_t bpp = 2; // bpp4
  constexpr uint16_t rotation = 0; // 0°
  constexpr uint16_t config = (endian << 8) | (bpp << 4) | rotation;

  writeData(config, uint16_t{0}, uint16_t{0}, _info.width, _info.height);
  writePattern(0xff, _info.width * _info.height / 2);
  sendCommand(Command::LD_IMG_END);
}

essentials::Span<uint8_t> WaveshareIT8951::performBufferTransaction(bool keepCSActive, int readSize, int writeSize) {
  uint8_t* writeBuffer = _selectedBuffer->data(); // beginning of DMA buffer
  uint8_t* readBuffer =
    _selectedBuffer->data() + (writeSize + (4 - writeSize % 4)); // after write buffer 4-byte aligned

  clearBuffer(writeSize + (4 - writeSize % 4), readSize);

  spi_transaction_t trans{};
  trans.flags = keepCSActive ? SPI_TRANS_CS_KEEP_ACTIVE : 0;
  trans.length = writeSize * 8 + readSize * 8; // in bits
  trans.rxlength = readSize * 8; // in bits
  trans.tx_buffer = writeSize == 0 ? nullptr : writeBuffer;
  trans.rx_buffer = readSize == 0 ? nullptr : readBuffer;

  Exception::check(spi_device_transmit(_spi, &trans));

  return essentials::Span<uint8_t>{readBuffer, static_cast<std::size_t>(readSize)};
}

void WaveshareIT8951::clearBuffer(int begin /* = 0*/, int count /* = -1*/, uint8_t value /* = 0*/) {
  auto b = _selectedBuffer->begin() + begin;
  auto e = count < 0 ? _selectedBuffer->end() : _selectedBuffer->begin() + begin + count;

  // NOTE _selectedBuffer->is random access iterator
  if (b >= _selectedBuffer->end() || e > _selectedBuffer->end()) return;

  std::fill(b, e, value);
}
