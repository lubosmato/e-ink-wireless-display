#pragma once

class IT8951 {
  enum PREAMBLE { COMMAND = 0x6000, WRITE_DATA = 0x0000, READ_DATA = 0x1000 };

  enum COMMANDS {
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
    DPY_BUF_AREA = 0x0037
  };

  enum REGISTER {
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

  union DevInfo {
    struct {
      uint16_t width;
      uint16_t height;
      uint16_t imgBufAddrL;
      uint16_t imgBufAddrH;
      char FWVersion[16];
      char LUTVersion[16];
    };
    uint16_t data[20];
  };

public:
  enum ROTATE {
    ROTATE_0 = 0,
    ROTATE_90 = 1,
    ROTATE_180 = 2,
    ROTATE_270 = 3,
  };

  enum BPP {
    BPP_2 = 0,
    BPP_3 = 1,
    BPP_4 = 2,
    BPP_8 = 3,
  };

  enum ENDIAN { LITTLE = 0, BIG = 1 };

  /** \brief Construct new IT8951 object
   *  \param cspin     spi clock select GPIO pin
   *  \param resetpin  it8951 reset GPIO pin
   *  \param readypin  it8951 ready GPIO pin
   */
  IT8951(int cspin, int resetpin, int readypin);

  /** \brief Initialize E-Paper Display connection
   *  \param speed SPI speed in Hz
   *  \param timeoutReady maximum time (in milliseconds) to wait for ready line
   *  \param timeoutDisplay maximum time (in milliseconds) to wait for display refresh ready (excluding ready line)
   *  \return true if sucessfully initialized
   */
  bool begin(uint32_t speed = 4000000, uint32_t timeoutReady = 1000, uint32_t timeoutDisplay = 10000);

  /** \brief Deinitialize E-Paper Display connection
   */
  void end();

  /** \brief Set Display Active
   *  Enable clocks
   *  \return true if command successfully sent
   */
  bool active();

  /** \brief Set Display in standby mode
   *  Disable clocks
   *  \return true if command successfully sent
   */
  bool standby();

  /** \brief Set Display in sleep mode
   *  \return true if command successfully sent
   */
  bool sleep();

  /** \brief (Hard)Reset the Display
   *  \return true if successfully resetted
   */
  bool reset();

  /** \brief Retrieve/Update Device and Panel Information
   *  \return true if successfully updated device information
   */
  bool updateDeviceInfo();

  /** \brief Set Target Memory Buffer
   *  \param addr   Target memory buffer base address (default: 0 for auto image buffer)
   *  \return true if successfully updated image buffer register
   */
  bool setImageBuffer(uint32_t addr);

  /** \brief Get current Target Memory Buffer
   *  \param addr   Target memory buffer base address (default: 0 for auto image buffer)
   *  \return true if successfully received image buffer register
   */
  bool getImageBuffer(uint32_t& addr);

  /** \brief Retrieve default target Memory Buffer
   *  \return true Default target memory buffer base address
   */
  uint32_t defaultImageBuffer();

  /** \brief Get Display Width
   *  \return width of display
   */
  uint16_t width();

  /** \brief Get Display Height
   *  \return height of display
   */
  uint16_t height();

  /** \brief Get Firmware Version
   *  \return pointer to 8 byte string buffer
   */
  char* getFW();

  /** \brief Get LUT Version
   *  \return pointer to 8 byte string buffer
   */
  char* getLUT();

  /** \brief Wait until Display signals ready LUT Version
   *  \param timeout  additional (to timeoutDisplay) timeout
   *  \return true if ready received before both timeouts were triggered
   */
  bool waitForDisplay(uint32_t timeout = 0);

  /** \brief Load Image from host buffer into IT8951 buffer
   *
   *  \param buf    pointer to host buffer
   *  \param len    length of buffer
   *  \param x      left space (default: no space)
   *  \param y      top space (default: no space)
   *  \param width  width of image (default: UINT16_MAX for maximum of display)
   *  \param height height of image (default: UINT16_MAX for maximum of display)
   *  \param rot    Rotation of image (default: none)
   *  \param bpp    Bits per pixel, buffer packed like described in IT8951 Manual / Fig 7-17 (default: 4bpp / 16 color)
   *  \param e      Endianess (default: little endian)
   *  \param addr   Target memory buffer base address (default: 0 for auto image buffer)
   *  \return true if successfully executed, false on error (dimension issues, length invalid etc)
   */
  bool load(uint16_t* buf,
    size_t len,
    uint16_t x = 0,
    uint16_t y = 0,
    uint16_t width = UINT16_MAX,
    uint16_t height = UINT16_MAX,
    enum ROTATE rot = ROTATE_0,
    enum BPP bpp = BPP_4,
    enum ENDIAN e = LITTLE,
    uint32_t addr = 0);

  /** \brief Fill Image buffer with Pattern
   *
   *  \param pattern 16 Bit Pattern
   *  \param x       left space (default: no space)
   *  \param y       top space (default: no space)
   *  \param width   width of image (default: UINT16_MAX for maximum of display)
   *  \param height  height of image (default: UINT16_MAX for maximum of display)
   *  \param rot     Rotation of image (default: none)
   *  \param bpp     Bits per pixel, buffer packed like described in IT8951 Manual / Fig 7-17 (default: 4bpp / 16 color)
   *  \param e       Endianess (default: little endian)
   *  \param addr    Target memory buffer base address (default: 0 for auto image buffer)
   *  \return true if successfully executed, false on error (dimension issues, length invalid etc)
   */
  bool fill(uint16_t pattern,
    uint16_t x = 0,
    uint16_t y = 0,
    uint16_t width = UINT16_MAX,
    uint16_t height = UINT16_MAX,
    enum ROTATE rot = ROTATE_0,
    enum BPP bpp = BPP_4,
    enum ENDIAN e = LITTLE,
    uint32_t addr = 0);

  /** \brief Clear Image buffer
   *
   *  \param white  white or black
   *  \param x      left space (default: no space)
   *  \param y      top space (default: no space)
   *  \param width  width of image (default: UINT16_MAX for maximum of display)
   *  \param height height of image (default: UINT16_MAX for maximum of display)
   *  \param addr    Target memory buffer base address (default: 0 for auto image buffer)
   *  \return true if successfully executed, false on error (dimension issues, length invalid etc)
   */
  bool clear(bool white = true,
    uint16_t x = 0,
    uint16_t y = 0,
    uint16_t width = UINT16_MAX,
    uint16_t height = UINT16_MAX,
    uint32_t addr = 0);

  /** \brief Display IT8951 buffer
   *
   *  \param x      left space (default: no space)
   *  \param y      top space (default: no space)
   *  \param width  width of image (default: UINT16_MAX for maximum of display)
   *  \param height height of image (default: UINT16_MAX for maximum of display)
   *  \param mode   Mode (waveform? Found no documentation, but display function 2 works quite well)
   *  \param addr   Target memory buffer base address (default: 0 for auto image buffer)
   *  \return true if successfully executed, false on error (dimension issues, length invalid etc)
   */
  bool display(uint16_t x = 0,
    uint16_t y = 0,
    uint16_t width = UINT16_MAX,
    uint16_t height = UINT16_MAX,
    uint16_t mode = 2,
    uint32_t addr = 0);

private:
  bool waitUntilReady(uint32_t timeout = 0);
  bool command(enum COMMANDS cmd);
  bool write(uint16_t data[], size_t len, size_t repeat = 1);
  bool read(uint16_t data[], size_t len);
  bool readRegister(enum REGISTER reg, uint16_t& value);
  bool writeRegister(enum REGISTER reg, uint16_t value);
  bool memBurstWrite(uint32_t addr, uint32_t size, uint16_t* buf);
  bool memBurstRead(uint32_t addr, uint32_t size, uint16_t* buf);

  int _cs, _rst, _hrdy;
  DevInfo info;
  uint32_t SPIspeed, timeoutReady, timeoutDisplay;
};