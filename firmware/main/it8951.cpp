#include "it8951.hpp"


IT8951::IT8951(int cspin, int resetpin, int readypin) : _cs(cspin), _rst(resetpin), _hrdy(readypin) {
}

bool IT8951::begin(uint32_t speed, uint32_t timeoutReady, uint32_t timeoutDisplay){
  SPIspeed = speed;
  this->timeoutReady = timeoutReady;
  this->timeoutDisplay = timeoutDisplay;

  return reset();
}

void IT8951::end(){
  SPI.end();
}

bool IT8951::reset(){
  SPI.end();
  // busy state
  pinMode(_hrdy, INPUT);

  // clock select
  digitalWrite(_cs, HIGH);
  pinMode(_cs, OUTPUT);

  // hardware SPI
  SPI.begin();

  // reset line
  digitalWrite(_rst, LOW);
  pinMode(_rst, OUTPUT);
  delay(10);
  digitalWrite(_rst, HIGH);
  delay(10);
  waitUntilReady(10000);
  // get Dev Info
  updateDeviceInfo();

  // Enable I80 Packed mode
  bool val = writeRegister(I80CPCR, 0x0001);
  delay(10);
  setImageBuffer(info.imgBufAddrL | (info.imgBufAddrH << 16));
  return val;
}

bool IT8951::waitUntilReady(uint32_t timeout){
  for (uint32_t i = 0; i < timeoutReady || i < timeout; i++){
    if (digitalRead(_hrdy) == HIGH)
      return true;
    else
      delay(1);
  }
  return false;
}

bool IT8951::command(enum COMMANDS cmd) {
  bool success = true;
  SPI.beginTransaction(SPISettings(SPIspeed, MSBFIRST, SPI_MODE0));
  digitalWrite(_cs, LOW);
  if ((success = waitUntilReady())){
    SPI.transfer16(COMMAND);
    if ((success = waitUntilReady()))
      SPI.transfer16(cmd);
  }
  digitalWrite(_cs, HIGH);
  SPI.endTransaction();
  return success;
}

bool IT8951::write(uint16_t data[], size_t len, size_t repeat){
  bool success = true;
  SPI.beginTransaction(SPISettings(SPIspeed, MSBFIRST, SPI_MODE0));
  digitalWrite(_cs, LOW);
  if ((success = waitUntilReady())){
    SPI.transfer16(WRITE_DATA);
    if ((success = waitUntilReady())){
      for (size_t j = 0; j < repeat; j++)
        for (size_t i = 0; i < len; i++)
          SPI.transfer16(data[i]);
    }
  }
  digitalWrite(_cs, HIGH);
  SPI.endTransaction();
  return success;
}

bool IT8951::read(uint16_t data[], size_t len) {
  bool success = true;
  SPI.beginTransaction(SPISettings(SPIspeed, MSBFIRST, SPI_MODE0));
  digitalWrite(_cs, LOW);
  if ((success = waitUntilReady())){
    SPI.transfer16(READ_DATA);
    if ((success = waitUntilReady())){
      data[0] = SPI.transfer16(0);
      if ((success = waitUntilReady())){
        for (size_t i = 0; i < len; i++)
          data[i] = SPI.transfer16(0);
      }
    }
  }
  digitalWrite(_cs, HIGH);
  SPI.endTransaction();
  return success;
}

bool IT8951::readRegister(enum REGISTER reg, uint16_t & value){
  uint16_t v = reg;
  return command(REG_RD)
      && write(&v, 1)
      && read(&value, 1);
  
}

bool IT8951::writeRegister(enum REGISTER reg, uint16_t value){
  uint16_t values[2] = { reg, value };
  return command(REG_WR)
      && write(values, 2);
}

bool IT8951::waitForDisplay(uint32_t timeout){
  uint16_t value;
  for (uint32_t i = 0; i < timeoutDisplay || i < timeout; i++){
    if (!readRegister(LUTAFSR, value))
      return false;
    else if (value == 0) // if Reg is 0 then ready
      return true;
    else
      delay(1);
  }
  return false;
}

bool IT8951::updateDeviceInfo(){
  return command(GET_DEV_INFO)
      && read(info.data, 20);
}

uint32_t IT8951::defaultImageBuffer(){
  return ((uint32_t)info.imgBufAddrL) | (((uint32_t)info.imgBufAddrH) << 16);
}

bool IT8951::setImageBuffer(uint32_t addr){
  //Write LISAR Reg
  return writeRegister(LISAR_H, ((addr >> 16) & 0x0000FFFF))
      && writeRegister(LISAR_L, addr & 0x0000FFFF);
}

bool IT8951::getImageBuffer(uint32_t & addr){
  // Read LISAR Reg
  uint16_t low, high;
  if (readRegister(LISAR_H, high) && readRegister(LISAR_L, low)){
    addr = (((uint32_t)high) << 16) | ((uint32_t)low);
    return true;
  } else {
    return false;
  }
}

char * IT8951::getFW(){
  return info.FWVersion;
}

char * IT8951::getLUT(){
  return info.LUTVersion;
}

uint16_t IT8951::width(){
  return info.width;
}

uint16_t IT8951::height(){
  return info.height;
}
  
bool IT8951::active(){
  return command(SYS_RUN);
}

bool IT8951::standby(){
  return command(STANDBY);
}

bool IT8951::sleep(){
  return command(SLEEP);
}

bool IT8951::memBurstWrite(uint32_t addr, uint32_t size, uint16_t * buf){
    uint16_t values[4] = { 
      static_cast<uint16_t>(addr & 0x0000FFFF),         //addr[15:0]
      static_cast<uint16_t>((addr >> 16) & 0x0000FFFF), //addr[25:16]
      static_cast<uint16_t>(size & 0x0000FFFF),         //Cnt[15:0]
      static_cast<uint16_t>((size >> 16) & 0x0000FFFF)  //Cnt[25:16]
    };
    return command(MEM_BST_WR)
        && write(values, 4)
        && write(buf, size)
        && command(MEM_BST_END);
}

bool IT8951::memBurstRead(uint32_t addr, uint32_t size, uint16_t * buf){
    uint16_t values[4] = { 
      static_cast<uint16_t>(addr & 0x0000FFFF),         //addr[15:0]
      static_cast<uint16_t>((addr >> 16) & 0x0000FFFF), //addr[25:16]
      static_cast<uint16_t>(size & 0x0000FFFF),         //Cnt[15:0]
      static_cast<uint16_t>((size >> 16) & 0x0000FFFF)  //Cnt[25:16]
    };

    return command(MEM_BST_RD_T)
        && write(values, 4)
        && command(MEM_BST_RD_S)
        && read(buf, size)
        && command(MEM_BST_END);
}

bool IT8951::load(uint16_t *buf, size_t len, uint16_t x, uint16_t y, uint16_t width, uint16_t height, enum ROTATE rot, enum BPP bpp, enum ENDIAN e, uint32_t addr){
  // Check Dimension
  if (x > info.width || y > info.height)
    return false;
  if (x + width > info.width)
    width = info.width - x;
  if (y + height > info.height)
    height = info.height - y;
  if (width == 0 || height == 0)
    return false;

  size_t req = height * width;
  switch (bpp){
    case BPP_2:
      req /= 8;
      break;
    case BPP_3:
    case BPP_4:
      req /= 4;
      break;
    case BPP_8:
      req /= 2;
  }

  if (req != len)
    return false;

  // Calculate attributes
  uint16_t arg = (e << 8) | (bpp << 4) | (rot);

  // Full / partial refresh
  if (x == 0 && y == 0 && width == info.width && height == info.height) {
    return command(LD_IMG)
        && write(&arg, 1)
        && write(buf, len)
        && command(LD_IMG_END);
  } else {
    uint16_t args[5] = { arg, x, y, width, height };
    return command(LD_IMG_AREA)
        && write(args, 5)
        && write(buf, len)
        && command(LD_IMG_END);   
  }
}

bool IT8951::display(uint16_t x, uint16_t y, uint16_t width, uint16_t height, uint16_t mode, uint32_t addr){
  // Check Dimension
  if (x > info.width || y > info.height)
    return false;
  if (x + width > info.width)
    width = info.width - x;
  if (y + height > info.height)
    height = info.height - y;
  if (width == 0 || height == 0)
    return false;

  uint16_t args[7] = { x, y, width, height, mode, addr == 0 ? info.imgBufAddrL : (addr & 0x0000ffff), addr == 0 ? info.imgBufAddrH : ((addr >> 16) & 0x0000ffff)};

  return waitForDisplay()
      && command(DPY_BUF_AREA)
      && write(args, 7);
}

bool IT8951::fill(uint16_t pattern, uint16_t x, uint16_t y, uint16_t width, uint16_t height,  enum ROTATE rot, enum BPP bpp, enum ENDIAN e, uint32_t addr){
  if (x > info.width || y > info.height)
    return false;
  if (x + width > info.width)
    width = info.width - x;
  if (y + height > info.height)
    height = info.height - y;
  if (width == 0 || height == 0)
    return false;

  size_t rep = height * width;
    switch (bpp){
    case BPP_2:
      rep /= 8;
      break;
    case BPP_3:
    case BPP_4:
      rep /= 4;
      break;
    case BPP_8:
      rep /= 2;
  }

  // Calculate attributes
  uint16_t arg = (e << 8) | (bpp << 4) | (rot);

  // Full / partial refresh
  if (x == 0 && y == 0 && width == info.width && height == info.height) {
    return waitForDisplay()
        && command(LD_IMG)
        && write(&arg, 1)
        && write(&pattern, 1, rep)
        && command(LD_IMG_END);
        
  } else {
    
    uint16_t args[5] = { arg, x, y, width, height };
    return waitForDisplay()
        && command(LD_IMG_AREA)
        && write(args, 5)
        && write(&pattern, 1, rep)
        && command(LD_IMG_END);
  }
}

bool IT8951::clear(bool white, uint16_t x, uint16_t y, uint16_t width, uint16_t height, uint32_t addr){
  return fill(white ? 0xffff : 0x0000, x, y, width, height, ROTATE_0, BPP_4, LITTLE, addr);
}