# Pin ESP32 (sesuai skematik KiCad)

| Fungsi | Pin ESP32 DevKit V1 | Tersambung ke |
|---|---|---|
| I2C SDA | GPIO21 | SDA semua INA219 (J3, J4, J5, J6) |
| I2C SCL | GPIO22 | SCL semua INA219 |
| Relay 1 | GPIO33 | IN1 modul relay (J11) |
| Relay 2 | GPIO25 | IN2 |
| Relay 3 | GPIO26 | IN3 |
| Relay 4 | GPIO27 | IN4 |
| TFT DC | GPIO16 | DC (J12) |
| TFT CS | GPIO17 | CS |
| TFT SCK | GPIO18 | SCK |
| TFT MOSI | GPIO23 | MOSI |
| LED bawaan | GPIO2 | (tidak dipakai skematik, dipakai untuk uji koneksi) |
| 3V3 | 3V3 | VCC semua INA219 |
| 5V_CTRL | VIN | VCC modul relay, sekaligus sumber ESP32 |
| GND | GND | GND bersama |

## Alamat INA219 → kanal

| Konektor | Alamat | Jumper di modul | Kanal |
|---|---|---|---|
| J3 | 0x40 | tanpa jumper | 1 |
| J4 | 0x41 | solder A0 | 2 |
| J5 | 0x44 | solder A1 | 3 |
| J6 | 0x45 | solder A0 + A1 | 4 |

## Library Arduino

- ArduinoJson 7.x (Benoit Blanchon)
- Adafruit INA219 (+ Adafruit BusIO)
- Adafruit ILI9341 + Adafruit GFX Library (hanya bila memakai layar TFT)

## Hal yang perlu dicek di perangkat keras

1. **TFT tanpa pin RST dan LED.** Konektor J12 hanya punya VCC, GND, SCK, MOSI, CS, DC. Banyak modul ILI9341 butuh RST ke 3V3 (atau ke EN) dan LED/backlight ke 3V3. Cek modulmu, dan kalau perlu kabel RST/LED dipasang langsung di modul. Di library TFT_eSPI atur `TFT_RST = -1` dan `TFT_MISO = -1`.
2. **Tegangan VCC TFT (LCD_VCC).** Netnya terpisah dari 3V3. Pastikan modul TFT-mu memang untuk 3,3 V atau 5 V sesuai yang kamu sambungkan.
3. **Pengaman saat dicolok USB sekaligus VIN.** Jangan menyambung USB dan 5V_CTRL ke VIN bersamaan kalau board-mu tidak punya dioda pemisah. Saat upload sketch, lepas 5V_CTRL dulu.
4. **Urutan INA219 dan relay di jalur beban.** Skematik ini tidak menunjukkannya. Kalau INA219 dipasang setelah relay, tegangan terbaca 0 V saat relay mati. Dashboard sudah memaklumi hal ini.
5. **Pull-up I2C.** Modul INA219 biasanya sudah membawa pull-up. Jika bus tidak stabil dengan 4 modul, cek kabel pendek dan pull-up total (sekitar 2–5 kΩ).
