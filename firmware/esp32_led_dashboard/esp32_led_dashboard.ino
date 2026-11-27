/*
  Prototipe: ESP32 <-> Vercel (HTTPS)
  - Mengirim data SIMULASI 4 kanal (tegangan, arus, daya) tiap INTERVAL_MS.
  - Respons server membawa perintah admin; ESP32 menyalakan/mematikan LED bawaan.
  - Nanti, ganti fungsi buatPayload() dengan bacaan INA219 sungguhan.

  Library yang perlu dipasang (Arduino IDE > Library Manager):
    - "ArduinoJson" oleh Benoit Blanchon (versi 7.x)
  Board: "ESP32 Dev Module" (paket "esp32" by Espressif dari Boards Manager).
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================== ISI SESUAI MILIKMU ==================
const char* WIFI_SSID    = "NAMA_HOTSPOT";
const char* WIFI_PASS    = "PASSWORD_HOTSPOT";
const char* API_URL      = "https://NAMA-PROJECT.vercel.app/api/ingest";
const char* DEVICE_TOKEN = "SAMA_DENGAN_DEVICE_TOKEN_DI_VERCEL";
// ========================================================

const int LED_PIN = 2;                       // LED bawaan DevKit V1 umumnya di GPIO2
const unsigned long INTERVAL_MS   = 3000;    // jeda antar pengiriman
const unsigned long WIFI_RETRY_MS = 8000;    // jeda antar percobaan sambung ulang Wi-Fi

bool ledOn = false;
unsigned long lastSend = 0;
unsigned long lastWifiTry = 0;

void setLed(bool on) {
  ledOn = on;
  digitalWrite(LED_PIN, on ? HIGH : LOW);
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

// Nilai acak di sekitar "base" (+/- jitter). Hanya untuk simulasi.
float simulasi(float base, float jitter) {
  return base + (random(-100, 101) / 100.0f) * jitter;
}

// Ganti isi fungsi ini dengan bacaan INA219 saat komponen sudah datang.
String buatPayload() {
  JsonDocument doc;
  doc["uptime_s"] = millis() / 1000;
  doc["rssi"] = WiFi.RSSI();
  doc["led_on"] = ledOn;

  JsonArray kanal = doc["kanal"].to<JsonArray>();
  for (int ch = 1; ch <= 4; ch++) {
    float v = simulasi(12.0f, 0.15f);
    float i = fabsf(simulasi(0.20f * ch, 0.03f));
    float p = v * i;
    JsonObject o = kanal.add<JsonObject>();
    o["ch"] = ch;
    o["v"] = roundf(v * 100.0f) / 100.0f;
    o["i"] = roundf(i * 1000.0f) / 1000.0f;
    o["p"] = roundf(p * 100.0f) / 100.0f;
  }

  String out;
  serializeJson(doc, out);
  return out;
}

// Kirim data, lalu baca perintah dari respons.
bool kirimDanSinkron() {
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

  String payload = buatPayload();
  int code = http.POST(payload);

  if (code == 200) {
    String body = http.getString();
    JsonDocument res;
    DeserializationError err = deserializeJson(res, body);
    if (!err) {
      JsonVariant led = res["perintah"]["led"];
      if (led.is<bool>()) {
        bool minta = led.as<bool>();
        if (minta != ledOn) {
          setLed(minta);
          Serial.printf("Perintah baru: LED %s\n", minta ? "ON" : "OFF");
        }
      }
      Serial.printf("OK (200). LED=%s\n", ledOn ? "ON" : "OFF");
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
  pinMode(LED_PIN, OUTPUT);
  setLed(false);
  randomSeed(micros());
  sambungWiFi(20000);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiTry > WIFI_RETRY_MS) {
      lastWifiTry = millis();
      Serial.println("Wi-Fi putus, mencoba sambung ulang...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
    delay(50);
    return;
  }

  if (millis() - lastSend >= INTERVAL_MS) {
    lastSend = millis();
    kirimDanSinkron();
  }
}
