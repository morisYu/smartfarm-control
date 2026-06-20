#include <DHT.h>

int pinPumpDir = 7;
int pinPumpPwm = 5;
int pinBuzzer = 6;
int pinRgbR = 9;
int pinRgbG = 10;
int pinRgbB = 11;
int pinLight = A0;
int pinSoil = A1;
int pinDht = 2; // DHT 온습도 센서 기본 핀

#define DHTTYPE DHT11 // 만약 DHT22를 쓰신다면 DHT22로 변경하세요
DHT* dht = nullptr;

unsigned long lastSensorReadTime = 0;
unsigned long lastDhtReadTime = 0;
float cachedH = 0.0;
float cachedT = 0.0;

void setup() {
  Serial.begin(115200); // 웹 브라우저와의 통신 속도
  dht = new DHT(pinDht, DHTTYPE);
  dht->begin();
  updatePinModes();
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n'); 
    cmd.trim(); 
    
    // RGB 색상 제어
    if (cmd.startsWith("RGB:")) {
      int firstComma = cmd.indexOf(',');
      int secondComma = cmd.indexOf(',', firstComma + 1);
      
      if (firstComma > 0 && secondComma > 0) {
        int r = cmd.substring(4, firstComma).toInt();
        int g = cmd.substring(firstComma + 1, secondComma).toInt();
        int b = cmd.substring(secondComma + 1).toInt();
        
        analogWrite(pinRgbR, r);
        analogWrite(pinRgbG, g);
        analogWrite(pinRgbB, b);
      }
    } 
    // 워터 펌프(DC모터 DIR/PWM) 제어
    else if (cmd.startsWith("PUMP:")) {
      int comma = cmd.indexOf(',');
      if (comma != -1) {
        int dir = cmd.substring(5, comma).toInt();
        int speed = cmd.substring(comma + 1).toInt();
        digitalWrite(pinPumpDir, dir > 0 ? HIGH : LOW);
        analogWrite(pinPumpPwm, speed); // 0 ~ 255 속도 제어
      }
    }
    // 부저(주파수 톤) 제어
    else if (cmd.startsWith("BUZ:")) {
      int freq = cmd.substring(4).toInt();
      if (freq > 0) {
        tone(pinBuzzer, freq); // 원하는 주파수로 소리 출력
      } else {
        noTone(pinBuzzer);     // 소리 끄기
      }
    }
    // 동적 핀 설정 제어
    else if (cmd.startsWith("CFG:")) {
      parseConfigString(cmd);
    }
  }

  unsigned long currentMillis = millis();

  // DHT11은 측정 속도가 느리므로 2초에 한 번만 읽고 캐싱 (통신 딜레이 방지)
  if (currentMillis - lastDhtReadTime >= 2000) {
    lastDhtReadTime = currentMillis;
    float readH = dht->readHumidity();
    float readT = dht->readTemperature();
    if (!isnan(readH) && !isnan(readT)) {
      cachedH = readH;
      cachedT = readT;
    }
  }

  // 센서 데이터 0.2초마다 전송 (모니터링 대시보드 및 블록코딩용)
  if (currentMillis - lastSensorReadTime >= 200) {
    lastSensorReadTime = currentMillis;
    
    int l = analogRead(pinLight); 
    int s = analogRead(pinSoil);
    
    Serial.print("H:"); Serial.print(cachedH);
    Serial.print(",T:"); Serial.print(cachedT);
    Serial.print(",L:"); Serial.print(l);
    Serial.print(",S:"); Serial.println(s);
  }
}

// 핀 모드 초기화 및 핀 재설정 시 호출
void updatePinModes() {
  pinMode(pinPumpDir, OUTPUT);
  pinMode(pinPumpPwm, OUTPUT);
  pinMode(pinBuzzer, OUTPUT);
  pinMode(pinRgbR, OUTPUT);
  pinMode(pinRgbG, OUTPUT);
  pinMode(pinRgbB, OUTPUT);
  
  digitalWrite(pinPumpDir, LOW);
  analogWrite(pinPumpPwm, 0);
  noTone(pinBuzzer);
  analogWrite(pinRgbR, 0); 
  analogWrite(pinRgbG, 0); 
  analogWrite(pinRgbB, 0);
}

// 웹에서 날아온 핀 설정 명령(CFG:) 파싱
void parseConfigString(String cmd) {
  int rgbIdx = cmd.indexOf("RGB:");
  if(rgbIdx != -1) {
    int rComma = cmd.indexOf(',', rgbIdx);
    int gComma = cmd.indexOf(',', rComma + 1);
    int bComma = cmd.indexOf(',', gComma + 1);
    if(bComma == -1) bComma = cmd.length();
    pinRgbR = cmd.substring(rgbIdx + 4, rComma).toInt();
    pinRgbG = cmd.substring(rComma + 1, gComma).toInt();
    pinRgbB = cmd.substring(gComma + 1, bComma).toInt();
  }
  
  int pumpIdx = cmd.indexOf("PUMP:");
  if(pumpIdx != -1) {
    int comma1 = cmd.indexOf(',', pumpIdx);
    int comma2 = cmd.indexOf(',', comma1 + 1);
    if(comma1 != -1 && comma2 != -1) {
      pinPumpDir = cmd.substring(pumpIdx + 5, comma1).toInt();
      pinPumpPwm = cmd.substring(comma1 + 1, comma2).toInt();
    }
  }

  int buzIdx = cmd.indexOf("BUZ:");
  if(buzIdx != -1) {
    int comma = cmd.indexOf(',', buzIdx);
    if(comma == -1) comma = cmd.length();
    pinBuzzer = cmd.substring(buzIdx + 4, comma).toInt();
  }

  int dhtIdx = cmd.indexOf("DHT:");
  if(dhtIdx != -1) {
    int comma = cmd.indexOf(',', dhtIdx);
    if(comma == -1) comma = cmd.length();
    pinDht = cmd.substring(dhtIdx + 4, comma).toInt();
    
    // DHT 핀이 변경되었으면 객체 재생성
    if (dht != nullptr) {
      delete dht;
    }
    dht = new DHT(pinDht, DHTTYPE);
    dht->begin();
  }

  // 변경된 핀 번호를 적용
  updatePinModes();
}
