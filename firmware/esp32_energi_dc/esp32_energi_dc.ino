/*
  Monitor Energi DC & Kontrol Beban 4 Kanal  —  ESP32 DevKit V1 (30 pin)

  Disesuaikan dengan skematik KiCad:
    I2C   : SDA = GPIO21, SCL = GPIO22  (INA219 semua di +3V3)
    INA219: J3 = 0x40 (kanal 1), J4 = 0x41 (kanal 2), J5 = 0x44 (kanal 3), J6 = 0x45 (kanal 4)
    Relay : RELAY1 = GPIO33, RELAY2 = GPIO25, RELAY3 = GPIO26, RELAY4 = GPIO27
    TFT   : DC = GPIO16, CS = GPIO17, SCK = GPIO18, MOSI = GPIO23  (belum dipakai di sketch ini)

  Alur: baca 4 INA219 -> kirim JSON ke /api/ingest (HTTPS) -> balasan membawa perintah relay/LED
        dari dashboard -> relay dan LED diatur.

  Library (Arduino IDE > Library Manager):
    - "ArduinoJson"      oleh Benoit Blanchon (versi 7.x)
    - "Adafruit INA219"  oleh Adafruit (pasang juga "Adafruit BusIO" kalau diminta)
  Board: "ESP32 Dev Module" (paket "esp32" by Espressif).
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_INA219.h>

// Layar TFT (opsional). Perlu library "Adafruit ILI9341" + "Adafruit GFX Library".
// Kalau library belum terpasang, bagian TFT otomatis dilewati dan sketch tetap bisa dikompilasi.
#if __has_include(<Adafruit_ILI9341.h>)
  #include <Adafruit_GFX.h>
  #include <Adafruit_ILI9341.h>
  #define ADA_TFT 1
#endif

// ================== ISI SESUAI MILIKMU ==================
const char* WIFI_SSID    = "NAMA_HOTSPOT";
const char* WIFI_PASS    = "PASSWORD_HOTSPOT";
const char* API_URL      = "https://NAMA-PROJECT.vercel.app/api/ingest";
const char* DEVICE_TOKEN = "SAMA_DENGAN_DEVICE_TOKEN_DI_VERCEL";
// ========================================================

// true  = baca INA219 sungguhan.
// false = kirim data simulasi (berguna untuk uji relay tanpa sensor terpasang).
const bool PAKAI_SENSOR = true;

// ---- Pin (sesuai skematik) ----
const int PIN_SDA = 21;
const int PIN_SCL = 22;
const int LED_PIN = 2;                                  // LED bawaan DevKit (GPIO2, tidak dipakai skematik)
const int RELAY_PIN[4] = {33, 25, 26, 27};              // RELAY1..RELAY4

// Modul relay umumnya "aktif LOW" (IN = LOW -> relay menyala).
// Jika relay malah terbalik saat diuji, ubah menjadi false.
const bool RELAY_AKTIF_LOW = true;

// ---- INA219: alamat tiap kanal (atur lewat jumper A0/A1 di modul) ----
//   0x40 = tanpa jumper | 0x41 = A0 | 0x44 = A1 | 0x45 = A0 + A1
Adafruit_INA219 ina[4] = {
  Adafruit_INA219(0x40), Adafruit_INA219(0x41),
  Adafruit_INA219(0x44), Adafruit_INA219(0x45)
};
bool inaAda[4] = {false, false, false, false};

const unsigned long INTERVAL_MS   = 3000;   // jeda antar pengiriman
const unsigned long WIFI_RETRY_MS = 8000;   // jeda antar percobaan sambung ulang Wi-Fi

bool ledOn = false;
bool relayOn[4] = {false, false, false, false};
unsigned long lastSend = 0;
unsigned long lastWifiTry = 0;

// Nilai terakhir tiap kanal (dipakai layar TFT)
float lastV[4], lastI[4], lastP[4];
bool adaData[4] = {false, false, false, false};
bool netOK = false;

// ---- Layar TFT ILI9341 (sesuai skematik: SCK=18, MOSI=23, CS=17, DC=16) ----
// SCK 18 dan MOSI 23 adalah pin SPI bawaan (VSPI) ESP32, jadi tidak perlu pengaturan khusus.
const bool PAKAI_TFT = true;
const int PIN_TFT_CS = 17;
const int PIN_TFT_DC = 16;
const int PIN_TFT_RST = -1;     // RST tidak ada di konektor: sambungkan RST modul ke 3V3 (atau ke EN)

// Batas lokal untuk warna status di layar (dashboard punya pengaturan batas sendiri di browser).
const float BATAS_ARUS_A[4] = {1.0f, 1.0f, 1.0f, 1.0f};
const float V_MIN = 11.0f, V_MAX = 13.0f;

#ifdef ADA_TFT
Adafruit_ILI9341 tft(&SPI, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);
bool tftSiap = false;

// Warna kanal (RGB565) = warna yang sama dengan grafik di dashboard
const uint16_t WARNA_KANAL[4] = {0x2BDA, 0xEB46, 0x1D6F, 0xED00};
const uint16_t C_BG = ILI9341_BLACK, C_TEKS = ILI9341_WHITE, C_REDUP = 0x8410;
const uint16_t C_OK = 0x07E0, C_CEK = 0xFEA0, C_BAHAYA = 0xF800;

// -1 tidak ada data, 0 normal, 1 cek, 2 bahaya
int levelKanal(int k) {
  if (!adaData[k]) return -1;
  int lv = 0;
  float lim = BATAS_ARUS_A[k];
  if (lastI[k] > lim) lv = 2;
  else if (lastI[k] > 0.8f * lim) lv = 1;
  if (relayOn[k]) {   // relay mati -> tegangan 0 V itu wajar
    if (lastV[k] < V_MIN - 0.5f || lastV[k] > V_MAX + 0.5f) lv = 2;
    else if ((lastV[k] < V_MIN || lastV[k] > V_MAX) && lv < 1) lv = 1;
  }
  return lv;
}

void tftTulis(int x, int y, uint8_t ukuran, uint16_t fg, const char* teks) {
  tft.setTextSize(ukuran);
  tft.setTextColor(fg, C_BG);   // latar ikut digambar, jadi angka lama tertimpa tanpa berkedip
  tft.setCursor(x, y);
  tft.print(teks);
}

void tftHeader(bool online) {
  tft.fillRect(0, 0, 320, 26, 0x0841);
  tft.setTextSize(2);
  tft.setTextColor(C_TEKS, 0x0841);
  tft.setCursor(8, 5);
  tft.print("ENERGI DC");
  tft.setTextSize(1);
  tft.setTextColor(online ? C_OK : C_BAHAYA, 0x0841);
  tft.setCursor(online ? 262 : 256, 9);
  tft.print(online ? "ONLINE" : "OFFLINE");
  tft.fillCircle(246, 13, 4, online ? C_OK : C_BAHAYA);
}

void tftKerangka() {
  tft.fillScreen(C_BG);
  tftHeader(false);
  tftTulis(48, 32, 1, C_REDUP, "TEGANGAN");
  tftTulis(124, 32, 1, C_REDUP, "ARUS");
  tftTulis(194, 32, 1, C_REDUP, "DAYA");
  tftTulis(252, 32, 1, C_REDUP, "STATUS");
  tftTulis(298, 32, 1, C_REDUP, "R");
  for (int k = 0; k < 4; k++) {
    int y = 44 + k * 36;
    tft.fillRect(0, y, 4, 30, WARNA_KANAL[k]);
    tft.drawFastHLine(0, y + 32, 320, 0x2104);
    char nama[4];
    snprintf(nama, sizeof(nama), "B%d", k + 1);
    tftTulis(10, y + 6, 2, C_TEKS, nama);
  }
  tftTulis(8, 214, 1, C_REDUP, "TOTAL DAYA");
}

void tftData() {
  if (!tftSiap) return;
  tftHeader(netOK);
  char b[16];
  float total = 0;
  for (int k = 0; k < 4; k++) {
    int y = 44 + k * 36;
    int lv = levelKanal(k);
    if (adaData[k]) {
      snprintf(b, sizeof(b), "%5.2f", lastV[k]);  tftTulis(48, y + 6, 2, C_TEKS, b);
      snprintf(b, sizeof(b), "%5.3f", lastI[k]);  tftTulis(124, y + 6, 2, C_TEKS, b);
      snprintf(b, sizeof(b), "%5.2f", lastP[k]);  tftTulis(194, y + 6, 2, C_TEKS, b);
      total += lastP[k];
    } else {
      tftTulis(48, y + 6, 2, C_REDUP, " --- ");
      tftTulis(124, y + 6, 2, C_REDUP, " --- ");
      tftTulis(194, y + 6, 2, C_REDUP, " --- ");
    }
    uint16_t wl = lv == 2 ? C_BAHAYA : lv == 1 ? C_CEK : lv == 0 ? C_OK : C_REDUP;
    tftTulis(252, y + 10, 1, wl, lv == 2 ? "BAHAYA" : lv == 1 ? "CEK   " : lv == 0 ? "OK    " : "--    ");
    tft.fillCircle(304, y + 14, 5, relayOn[k] ? C_OK : 0x4208);
  }
  snprintf(b, sizeof(b), "%6.2f W", total);
  tftTulis(8, 224, 2, C_TEKS, b);
  tftTulis(176, 228, 1, C_REDUP, "R = relay (hijau = nyala)");
}
#endif

void setLed(bool on) {
  ledOn = on;
  digitalWrite(LED_PIN, on ? HIGH : LOW);
}

// Tulis level relay sesuai logika aktif LOW/HIGH.
void tulisRelay(int k, bool on) {
  digitalWrite(RELAY_PIN[k], (on == RELAY_AKTIF_LOW) ? LOW : HIGH);
}

void setRelay(int k, bool on) {
  relayOn[k] = on;
  tulisRelay(k, on);
}

void sambungWiFi(unsigned long timeoutMs) {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Menyambung ke Wi-Fi");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < timeoutMs) {
    delay(300);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nTersambung. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nBelum tersambung, akan dicoba lagi di loop().");
  }
}

// Nilai acak di sekitar "base" (+/- jitter). Hanya untuk mode simulasi.
float simulasi(float base, float jitter) {
  return base + (random(-100, 101) / 100.0f) * jitter;
}

// Baca satu kanal. Mengembalikan false jika kanal tidak punya data (sensor tidak terdeteksi).
bool bacaKanal(int k, float &v, float &i, float &p) {
  if (!PAKAI_SENSOR) {
    v = simulasi(12.0f, 0.15f);
    i = relayOn[k] ? fabsf(simulasi(0.20f * (k + 1), 0.03f)) : 0.0f;
    p = v * i;
    return true;
  }
  if (!inaAda[k]) return false;

  v = ina[k].getBusVoltage_V();       // tegangan di sisi VIN- (sisi beban)
  float mA = ina[k].getCurrent_mA();
  if (fabsf(mA) < 1.5f) mA = 0.0f;    // buang derau kecil saat tanpa beban
  i = fabsf(mA) / 1000.0f;
  p = v * i;
  return true;
}

// Susun JSON untuk /api/ingest. Kanal tanpa sensor dilewati.
String buatPayload(int &jumlahKanal) {
  JsonDocument doc;
  doc["uptime_s"] = millis() / 1000;
  doc["rssi"] = WiFi.RSSI();
  doc["led_on"] = ledOn;

  JsonArray kanal = doc["kanal"].to<JsonArray>();
  jumlahKanal = 0;
  for (int k = 0; k < 4; k++) {
    float v, i, p;
    adaData[k] = bacaKanal(k, v, i, p);
    if (!adaData[k]) continue;
    lastV[k] = v; lastI[k] = i; lastP[k] = p;
    JsonObject o = kanal.add<JsonObject>();
    o["ch"] = k + 1;
    o["v"] = roundf(v * 100.0f) / 100.0f;
    o["i"] = roundf(i * 1000.0f) / 1000.0f;
    o["p"] = roundf(p * 100.0f) / 100.0f;
    jumlahKanal++;
    Serial.printf("  K%d: %.2f V  %.3f A  %.2f W  (relay %s)\n", k + 1, v, i, p, relayOn[k] ? "ON" : "OFF");
  }

  String out;
  serializeJson(doc, out);
  return out;
}

// Terapkan perintah dari respons server.
void terapkanPerintah(JsonVariantConst perintah) {
  JsonVariantConst led = perintah["led"];
  if (led.is<bool>() && led.as<bool>() != ledOn) {
    setLed(led.as<bool>());
    Serial.printf("Perintah baru: LED %s\n", ledOn ? "ON" : "OFF");
  }
  for (int k = 0; k < 4; k++) {
    char kunci[8];
    snprintf(kunci, sizeof(kunci), "relay%d", k + 1);
    JsonVariantConst r = perintah[kunci];
    if (r.is<bool>() && r.as<bool>() != relayOn[k]) {
      setRelay(k, r.as<bool>());
      Serial.printf("Perintah baru: RELAY %d %s\n", k + 1, relayOn[k] ? "ON" : "OFF");
    }
  }
}

// Kirim data, lalu baca perintah dari respons.
bool kirimDanSinkron() {
  int jumlah = 0;
  String payload = buatPayload(jumlah);
  if (jumlah == 0) {
    Serial.println("Tidak ada kanal yang terbaca (cek kabel I2C / alamat INA219). Pengiriman dilewati.");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();  // PROTOTIPE: sertifikat server tidak diperiksa. Untuk versi final, pasang sertifikat root.

  HTTPClient http;
  http.setTimeout(8000);
  if (!http.begin(client, API_URL)) {
    Serial.println("http.begin gagal");
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);

  int code = http.POST(payload);

  if (code == 200) {
    String body = http.getString();
    JsonDocument res;
    DeserializationError err = deserializeJson(res, body);
    if (!err) {
      terapkanPerintah(res["perintah"]);
      Serial.printf("OK (200). %d kanal terkirim.\n", jumlah);
    } else {
      Serial.printf("Respons bukan JSON valid: %s\n", err.c_str());
    }
  } else if (code == 401) {
    Serial.println("DITOLAK (401): DEVICE_TOKEN di sketch tidak sama dengan di Vercel.");
  } else if (code > 0) {
    Serial.printf("Server membalas HTTP %d: %s\n", code, http.getString().c_str());
  } else {
    Serial.printf("Gagal terhubung: %s\n", http.errorToString(code).c_str());
  }

  http.end();
  return code == 200;
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // Relay: tulis level MATI dulu, baru jadikan output, supaya tidak berkedip saat boot.
  for (int k = 0; k < 4; k++) {
    tulisRelay(k, false);
    pinMode(RELAY_PIN[k], OUTPUT);
    tulisRelay(k, false);
  }
  pinMode(LED_PIN, OUTPUT);
  setLed(false);

  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000);
  if (PAKAI_SENSOR) {
    for (int k = 0; k < 4; k++) {
      inaAda[k] = ina[k].begin();   // begin() sudah memakai kalibrasi 32 V / 2 A
      Serial.printf("INA219 kanal %d: %s\n", k + 1, inaAda[k] ? "terdeteksi" : "TIDAK terdeteksi");
    }
    // Kalibrasi lain (opsional, panggil setelah begin):
    //   ina[k].setCalibration_32V_1A();   // resolusi lebih halus, maks 1 A
    //   ina[k].setCalibration_16V_400mA();// untuk beban kecil, maks 400 mA
  } else {
    Serial.println("MODE SIMULASI: data kanal dibuat acak.");
  }

#ifdef ADA_TFT
  if (PAKAI_TFT) {
    tft.begin(20000000);          // 20 MHz: aman untuk kabel jumper. Naikkan ke 40 MHz bila kabel pendek.
    tft.setRotation(1);           // mendatar 320 x 240
    tftKerangka();
    tftTulis(8, 100, 2, C_TEKS, "Menyambung Wi-Fi...");
    tftSiap = true;
  }
#else
  if (PAKAI_TFT) Serial.println("Library Adafruit ILI9341 belum terpasang: TFT dilewati.");
#endif

  randomSeed(micros());
  sambungWiFi(20000);

#ifdef ADA_TFT
  if (tftSiap) { tftKerangka(); tftData(); }
#endif
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiTry > WIFI_RETRY_MS) {
      lastWifiTry = millis();
      Serial.println("Wi-Fi putus, mencoba sambung ulang...");
      netOK = false;
#ifdef ADA_TFT
      if (tftSiap) tftHeader(false);
#endif
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
    delay(50);
    return;
  }

  if (millis() - lastSend >= INTERVAL_MS) {
    lastSend = millis();
    netOK = kirimDanSinkron();
#ifdef ADA_TFT
    tftData();   // gambar setelah perintah diterapkan, supaya status relay di layar ikut terbaru
#endif
  }
}
