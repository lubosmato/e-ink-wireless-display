// based on https://github.com/waveshare/IT8951 and
// thelazt's https://github.com/thelazt/waveshare-9.7inch-e-paper-hat
// big thanks to thelazt!

#pragma once

#include "dma_buffer.hpp"
#include "driver/spi_master.h"
#include "essentials/helpers.hpp"
#include "power.hpp"

struct WaveshareIT8951 {
  struct Pins {
    gpio_num_t rst{GPIO_NUM_22};
    gpio_num_t hrdy{GPIO_NUM_25};

    // defaults to VSPI pins
    gpio_num_t miso{GPIO_NUM_19};
    gpio_num_t mosi{GPIO_NUM_23};
    gpio_num_t sck{GPIO_NUM_18};
    gpio_num_t cs{GPIO_NUM_5};
  };

  struct Info {
    uint16_t width;
    uint16_t height;
    uint16_t bufferAddressL;
    uint16_t bufferAddressH;
    char fwVersion[16];
    char lutVersion[16];
  };

private:
  enum class Operation : uint16_t { COMMAND = 0x6000, WRITE = 0x0000, READ = 0x1000 };

  enum class Command : uint16_t {
    SYS_RUN = 0x0001,
    STANDBY = 0x0002,
    SLEEP = 0x0003,
    REG_RD = 0x0010,
    REG_WR = 0x0011,
    MEM_BST_RD_T = 0x0012,
    MEM_BST_RD_S = 0x0013,
    MEM_BST_WR = 0x0014,
    MEM_BST_END = 0x0015,
    LD_IMG = 0x0020,
    LD_IMG_AREA = 0x0021,
    LD_IMG_END = 0x0022,

    DPY_AREA = 0x0034,
    GET_DEV_INFO = 0x0302,
    DPY_BUF_AREA = 0x0037,
    VCOM = 0x0039,
  };

  enum class Register : uint16_t {
    // Base Address of Basic LUT Registers
    LUT0EWHR = 0x1000, // LUT0 Engine Width Height Reg
    LUT0XYR = 0x1040, // LUT0 XY Reg
    LUT0BADDR = 0x1080, // LUT0 Base Address Reg
    LUT0MFN = 0x10C0, // LUT0 Mode and Frame number Reg
    LUT01AF = 0x1114, // LUT0 and LUT1 Active Flag Reg

    // Update Parameter Setting Register
    UP0SR = 0x1134, // Update Parameter0 Setting Reg
    UP1SR = 0x1138, // Update Parameter1 Setting Reg
    UP1SR2 = 0x113A,

    LUT0ABFRV = 0x113C, // LUT0 Alpha blend and Fill rectangle Value
    UPBBADDR = 0x117C, // Update Buffer Base Address
    LUT0IMXY = 0x1180, // LUT0 Image buffer X/Y offset Reg
    LUTAFSR = 0x1224, // LUT Status Reg (status of All LUT Engines)

    BGVR = 0x1250, // Bitmap (1bpp) image color table

    // Address of System Registers
    I80CPCR = 0x0004,

    //-------Memory Converter Registers----------------
    MCSR = 0x0200,
    LISAR_L = 0x0208,
    LISAR_H = 0x020A,
  };

  DmaBuffer _generalDmaBuffer;
  DmaBuffer _pixelDmaBuffer;
  DmaBuffer* _selectedBuffer{};
  Pins _pinConfig;
  const Power& _power;
  spi_device_handle_t _spi{};
  Info _info{};

public:
  WaveshareIT8951(const Pins& pinConfig, const Power& power);
  void powerUp();
  void disconnect();
  void connect(float vcom);
  Info info() const;

  DmaBuffer& pixelBuffer();
  void clearBuffer(int begin = 0, int count = -1, uint8_t value = 0);

  void sendImage(uint16_t x, uint16_t y, uint16_t width, uint16_t height);
  void showImage(uint16_t x, uint16_t y, uint16_t width, uint16_t height);
  void clear();

private:
  static constexpr int defaultReadyTimeout = 10000;
  void waitForReady(int timeout = defaultReadyTimeout);
  void waitForDisplayImage();
  void readDeviceInfo();
  float readVCom();
  void writeVCom(float voltage);

  void sendCommand(Command command);

  essentials::Span<uint8_t> readBytes(int readSize);
  void writePixelBuffer(int writeSize);
  void writePattern(uint8_t pattern, int writeSize);

  void writeRegister(Register reg, uint16_t value);
  uint16_t readRegister(Register reg);

  template<typename... Args>
  void writeData(const Args&... args) {
    waitForReady();

    performTransaction(true, 0, Operation::WRITE);
    waitForReady();
    performTransaction(false, 0, args...);
  }

  template<typename... Args>
  essentials::Span<uint8_t> performTransaction(bool keepCSActive, int readSize, const Args&... args) {
    int writeSize = putIntoBuffer(0, args...);
    return performBufferTransaction(keepCSActive, readSize, writeSize);
  }

  essentials::Span<uint8_t> performBufferTransaction(bool keepCSActive, int readSize, int writeSize);

  template<typename... Args>
  int putIntoBuffer(int startIndex, const Args&... args) {
    using unused = int[];
    int i = startIndex;
    (void)unused{0, (i = internalPutIntoBuffer(i, args), 0)...};
    return i;
  }

  template<typename T>
  int internalPutIntoBuffer(int i, const T& value) {
    // NOTE this code is platform specific (will work only on little-endian)
    if constexpr (sizeof(T) == 1) {
      *reinterpret_cast<uint8_t*>(_selectedBuffer->data() + i) = value;
    } else if constexpr (sizeof(T) == 2) {
      *reinterpret_cast<uint16_t*>(_selectedBuffer->data() + i) = __builtin_bswap16(static_cast<uint16_t>(value));
    } else if constexpr (sizeof(T) == 4) {
      *reinterpret_cast<uint32_t*>(_selectedBuffer->data() + i) = __builtin_bswap32(static_cast<uint32_t>(value));
    } else if constexpr (sizeof(T) == 8) {
      *reinterpret_cast<uint32_t*>(_selectedBuffer->data() + i) = __builtin_bswap64(static_cast<uint64_t>(value));
    }
    return i + sizeof(T);
  }
};
