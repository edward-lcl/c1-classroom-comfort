/*
  C1 I2C scanner — run this FIRST after the ENS160+AHT20 board is soldered and the
  voltage checks in docs/HARDWARE_GUIDE.md are done.
  Expected result for a working board: 0x38 (AHT20/AHT21) and 0x53 or 0x52 (ENS160).
  Open Arduino IDE > Tools > Serial Monitor at 9600 baud.
*/
#include <Wire.h>

void setup() {
  Serial.begin(9600);
  Wire.begin();
  digitalWrite(SDA, LOW);  // disable UNO internal 5 V pull-ups (board pull-ups set the level)
  digitalWrite(SCL, LOW);
  Wire.setWireTimeout(25000, true);
  Serial.println(F("# I2C scan starting"));
}

void loop() {
  uint8_t found = 0;
  for (uint8_t a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      Serial.print(F("# found device at 0x"));
      if (a < 16) Serial.print('0');
      Serial.print(a, HEX);
      if (a == 0x38) Serial.print(F("  (AHT20/AHT21 temperature-humidity)"));
      if (a == 0x52 || a == 0x53) Serial.print(F("  (ENS160 gas sensor)"));
      Serial.println();
      found++;
    }
  }
  if (Wire.getWireTimeoutFlag()) {
    Serial.println(F("# I2C bus timed out - check SDA/SCL wiring and power"));
    Wire.clearWireTimeoutFlag();
  }
  Serial.print(F("# scan done, devices found: "));
  Serial.println(found);
  delay(5000);
}
