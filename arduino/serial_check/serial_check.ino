/*
  C1 step 0: prove the UNO can be programmed and talks to the laptop over USB.
  Upload, then open Tools > Serial Monitor at 9600 baud. You should see a new line
  every second and the onboard "L" LED blinking. If upload fails, see the
  troubleshooting section of docs/USER_GUIDE.md.
*/
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println(F("# C1 serial check: hello from the UNO"));
}

void loop() {
  static unsigned long n = 0;
  digitalWrite(LED_BUILTIN, n % 2);
  Serial.print(F("# tick "));
  Serial.print(n++);
  Serial.print(F("  A1 (light) raw = "));
  Serial.println(analogRead(A1));
  delay(1000);
}
