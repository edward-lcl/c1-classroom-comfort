/*
  C1 Classroom Comfort — sensor station sketch for Arduino UNO R3
  Group C1, IOT001TC (student prototype, not a safety monitor).

  Prints ONE JSON line every 2 seconds over USB serial (9600 baud).
  Format: see docs/SERIAL_PROTOCOL.md. The laptop app (app/) reads these lines.

  Turn sensors on ONE AT A TIME as each is wired and checked:
    ENABLE_LDR     photoresistor divider on A1 (5V -> LDR -> A1 junction -> 10k -> GND)
    ENABLE_LM35    LM35 output on A0 (check the pinout in the TI datasheet first)
    ENABLE_AHT20   AHT20 temperature/humidity over I2C (A4 = SDA, A5 = SCL)
    ENABLE_ENS160  ENS160 gas sensor over I2C (gives an eCO2 ESTIMATE, not measured CO2)

  The I2C sensors are OFF by default. Do not enable them until the purchased
  ENS160+AHT20 board has been identified and its voltage/pull-up checks in
  docs/HARDWARE_GUIDE.md are done.

  Only uses Wire.h (no extra libraries) to stay small on the UNO.
*/

#include <Wire.h>

#define ENABLE_LDR 1
#define ENABLE_LM35 1
#define ENABLE_AHT20 0
#define ENABLE_ENS160 0

const uint8_t LDR_PIN = A1;
const uint8_t LM35_PIN = A0;
const unsigned long INTERVAL_MS = 2000;

// ---- AHT20 (address 0x38) ----
const uint8_t AHT_ADDR = 0x38;
bool ahtReady = false;
float ahtT = 0, ahtRH = 0;

// ---- ENS160 (address 0x53 if ADD pin high, 0x52 if low) ----
uint8_t ensAddr = 0;
const uint8_t ENS_PART_ID = 0x00, ENS_OPMODE = 0x10, ENS_TEMP_IN = 0x13, ENS_RH_IN = 0x15, ENS_STATUS = 0x20;

unsigned long seq = 0;
unsigned long lastSample = 0;

// ---------------------------------------------------------------- I2C helpers
bool i2cWrite(uint8_t addr, const uint8_t *data, uint8_t len) {
  Wire.beginTransmission(addr);
  Wire.write(data, len);
  return Wire.endTransmission() == 0;
}

bool i2cReadReg(uint8_t addr, uint8_t reg, uint8_t *buf, uint8_t len) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(addr, len) != len) return false;
  for (uint8_t i = 0; i < len; i++) buf[i] = Wire.read();
  return true;
}

// ---------------------------------------------------------------- AHT20
uint8_t ahtCrc(const uint8_t *d, uint8_t len) {  // CRC-8, polynomial 0x31, init 0xFF
  uint8_t crc = 0xFF;
  for (uint8_t i = 0; i < len; i++) {
    crc ^= d[i];
    for (uint8_t b = 0; b < 8; b++) crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : crc << 1;
  }
  return crc;
}

bool ahtInit() {
  delay(100);  // datasheet: wait after power-on
  Wire.requestFrom(AHT_ADDR, (uint8_t)1);
  if (!Wire.available()) return false;
  uint8_t st = Wire.read();
  if ((st & 0x08) == 0) {  // not calibrated -> send init (command used by common AHT20 libraries)
    const uint8_t init[3] = {0xBE, 0x08, 0x00};
    if (!i2cWrite(AHT_ADDR, init, 3)) return false;
    delay(10);
  }
  return true;
}

bool ahtRead() {
  const uint8_t trig[3] = {0xAC, 0x33, 0x00};
  if (!i2cWrite(AHT_ADDR, trig, 3)) return false;
  delay(80);
  uint8_t d[7];
  if (Wire.requestFrom(AHT_ADDR, (uint8_t)7) != 7) return false;
  for (uint8_t i = 0; i < 7; i++) d[i] = Wire.read();
  if (d[0] & 0x80) return false;              // still busy
  if (ahtCrc(d, 6) != d[6]) return false;     // corrupted transfer
  uint32_t rawRH = ((uint32_t)d[1] << 12) | ((uint32_t)d[2] << 4) | (d[3] >> 4);
  uint32_t rawT = ((uint32_t)(d[3] & 0x0F) << 16) | ((uint32_t)d[4] << 8) | d[5];
  ahtRH = rawRH * 100.0 / 1048576.0;
  ahtT = rawT * 200.0 / 1048576.0 - 50.0;
  return true;
}

// ---------------------------------------------------------------- ENS160
bool ensDetect(uint8_t addr) {
  uint8_t id[2];
  return i2cReadReg(addr, ENS_PART_ID, id, 2) && id[0] == 0x60 && id[1] == 0x01;  // PART_ID 0x0160
}

bool ensInit() {
  ensAddr = ensDetect(0x53) ? 0x53 : (ensDetect(0x52) ? 0x52 : 0);
  if (!ensAddr) return false;
  const uint8_t standard[2] = {ENS_OPMODE, 0x02};  // STANDARD gas sensing mode
  return i2cWrite(ensAddr, standard, 2);
}

// Writes AHT20 readings to the ENS160 compensation registers. Returns true if written.
bool ensCompensate() {
  if (!ahtReady) return false;
  uint16_t t = (uint16_t)((ahtT + 273.15) * 64.0 + 0.5);
  uint16_t rh = (uint16_t)(ahtRH * 512.0 + 0.5);
  uint8_t buf[5] = {ENS_TEMP_IN, (uint8_t)(t & 0xFF), (uint8_t)(t >> 8), (uint8_t)(rh & 0xFF), (uint8_t)(rh >> 8)};
  return i2cWrite(ensAddr, buf, 5);  // TEMP_IN (0x13-0x14) then RH_IN (0x15-0x16), LSB first
}

// ---------------------------------------------------------------- setup / loop
void setup() {
  Serial.begin(9600);
#if ENABLE_AHT20 || ENABLE_ENS160
  Wire.begin();
  // Wire.begin() switches on the UNO's internal pull-ups to 5 V. Turn them off so the
  // sensor board's own pull-ups (expected to 3.3 V) set the bus voltage.
  digitalWrite(SDA, LOW);
  digitalWrite(SCL, LOW);
  Wire.setClock(100000);
  Wire.setWireTimeout(25000, true);  // never hang forever if the bus gets stuck
#endif
#if ENABLE_AHT20
  ahtReady = ahtInit();
#endif
#if ENABLE_ENS160
  ensInit();
#endif
  Serial.println(F("# C1 station starting (student prototype)"));
  Serial.print(F("{\"t\":\"boot\",\"v\":1,\"fw\":\"c1-station 1.0\",\"ldr\":"));
  Serial.print(ENABLE_LDR);
  Serial.print(F(",\"lm35\":"));
  Serial.print(ENABLE_LM35);
  Serial.print(F(",\"aht\":"));
  Serial.print(ENABLE_AHT20);
  Serial.print(F(",\"ens\":"));
  Serial.print(ENABLE_ENS160);
  Serial.println('}');
}

int readAnalog(uint8_t pin) {
  analogRead(pin);  // first read after switching pins can be inaccurate; discard it
  return analogRead(pin);
}

void loop() {
  if (millis() - lastSample < INTERVAL_MS) return;
  lastSample = millis();

  Serial.print(F("{\"t\":\"s\",\"v\":1,\"seq\":"));
  Serial.print(seq++);
  Serial.print(F(",\"ms\":"));
  Serial.print(lastSample);

#if ENABLE_LDR
  Serial.print(F(",\"light_raw\":"));
  Serial.print(readAnalog(LDR_PIN));
#endif
#if ENABLE_LM35
  Serial.print(F(",\"lm35_raw\":"));
  Serial.print(readAnalog(LM35_PIN));
#endif

#if ENABLE_AHT20
  if (!ahtReady) ahtReady = ahtInit();  // retry if it was not found at start-up
  bool ahtOk = ahtReady && ahtRead();
  Serial.print(F(",\"aht_ok\":"));
  Serial.print(ahtOk ? 1 : 0);
  if (ahtOk) {
    Serial.print(F(",\"aht_t\":"));
    Serial.print(ahtT, 2);
    Serial.print(F(",\"aht_rh\":"));
    Serial.print(ahtRH, 1);
  } else {
    ahtReady = false;
  }
#endif

#if ENABLE_ENS160
  if (!ensAddr) ensInit();
  bool ensOk = false;
  uint8_t d[6];  // DEVICE_STATUS, DATA_AQI, DATA_TVOC (2), DATA_ECO2 (2)
  bool comp = false;
  if (ensAddr) {
#if ENABLE_AHT20
    comp = ahtOk && ensCompensate();
#endif
    ensOk = i2cReadReg(ensAddr, ENS_STATUS, d, 6) && !(d[0] & 0x40);  // bit 6 = STATER (error)
    if (!ensOk) ensAddr = 0;
  }
  Serial.print(F(",\"ens_ok\":"));
  Serial.print(ensOk ? 1 : 0);
  if (ensOk) {
    Serial.print(F(",\"ens_val\":"));
    Serial.print((d[0] >> 2) & 0x03);  // 0 normal, 1 warm-up, 2 initial start-up, 3 invalid
    Serial.print(F(",\"ens_aqi\":"));
    Serial.print(d[1] & 0x07);
    Serial.print(F(",\"ens_tvoc\":"));
    Serial.print((uint16_t)d[2] | ((uint16_t)d[3] << 8));
    Serial.print(F(",\"ens_eco2\":"));
    Serial.print((uint16_t)d[4] | ((uint16_t)d[5] << 8));
    Serial.print(F(",\"ens_comp\":"));
    Serial.print(comp ? 1 : 0);
  }
#endif

  Serial.println('}');
}
