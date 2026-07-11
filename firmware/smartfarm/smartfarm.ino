#include <DHT.h>

int pinPumpDir = 7;
int pinPumpPwm = 6;
int pinBuzzer = 4;
int pinRgbR = 9;
int pinRgbG = 10;
int pinRgbB = 11;
int pinLight = A0; // DO(디지털 출력) 조도센서 핀 - digitalRead로 읽음
int pinSoil = A1;
int pinDht = 3; // DHT 온습도 센서 기본 핀

bool lightDO = true; // true: DO 타입(digitalRead), false: AO 타입(analogRead)

#define DHTTYPE DHT11 // 만약 DHT22를 쓰신다면 DHT22로 변경하세요
DHT* dht = nullptr;

unsigned long lastSensorReadTime = 0;
unsigned long lastDhtReadTime = 0;
float cachedH = 0.0;
float cachedT = 0.0;

// 안전 타임아웃: 시리얼 끊김 시 모터 자동 정지용
unsigned long lastCommandTime = 0;
bool pumpRunning = false;

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
    lastCommandTime = millis(); // 명령 수신 시각 갱신
    
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
        pumpRunning = (speed > 0);
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
    
    // lightDO 플래그에 따라 DO 또는 AO 방식으로 조도센서 읽기
    int l;
    if (lightDO) {
      // DO 타입: HIGH(어두움)=1023, LOW(밝음)=0
      l = digitalRead(pinLight) == HIGH ? 1023 : 0;
    } else {
      // AO 타입: 0~1023 연속 아날로그 값
      l = analogRead(pinLight);
    }
    int s = analogRead(pinSoil);
    
    Serial.print("H:"); Serial.print(cachedH);
    Serial.print(",T:"); Serial.print(cachedT);
    Serial.print(",L:"); Serial.print(l);
    Serial.print(",S:"); Serial.println(s);
  }

  // ★ 안전 타임아웃: 펌프 가동 중 3초간 명령 수신이 없으면 자동 정지
  // (시리얼 연결 끊김 시 모터가 계속 도는 것을 방지)
  if (pumpRunning && lastCommandTime > 0 && (currentMillis - lastCommandTime > 3000)) {
    analogWrite(pinPumpPwm, 0);
    digitalWrite(pinPumpDir, LOW);
    noTone(pinBuzzer);
    pumpRunning = false;
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
  // lightDO 설정에 따라 핀 모드 결정
  if (lightDO) {
    pinMode(pinLight, INPUT); // DO: 디지털 입력
  }
  // AO일 때는 analogRead가 자동으로 아날로그 입력으로 설정함
  
  digitalWrite(pinPumpDir, LOW);
  analogWrite(pinPumpPwm, 0);
  noTone(pinBuzzer);
  analogWrite(pinRgbR, 0); 
  analogWrite(pinRgbG, 0); 
  analogWrite(pinRgbB, 0);
}

// 아날로그 핀 문자열("A0" 등)을 아두이노 핀 번호로 변환하는 헬퍼
int parseAnalogPin(String pinStr) {
  pinStr.trim();
  if (pinStr.startsWith("A")) {
    return A0 + pinStr.substring(1).toInt();
  }
  return pinStr.toInt();
}

// 웹에서 날아온 핀 설정 명령(CFG:) 파싱
void parseConfigString(String cmd) {
  // ★ 이전 핀 상태 완전 정리 (핀 번호 변경 시 타이머/출력 충돌 방지)
  noTone(pinBuzzer);
  analogWrite(pinPumpPwm, 0);
  digitalWrite(pinPumpDir, LOW);
  analogWrite(pinRgbR, 0);
  analogWrite(pinRgbG, 0);
  analogWrite(pinRgbB, 0);

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

  // 조도센서 핀 설정 ("A0" 등 아날로그 핀 문자열 지원)
  int ligIdx = cmd.indexOf("LIG:");
  if(ligIdx != -1) {
    int comma = cmd.indexOf(',', ligIdx);
    if(comma == -1) comma = cmd.length();
    pinLight = parseAnalogPin(cmd.substring(ligIdx + 4, comma));
  }

  // 토양 수분센서 핀 설정
  int soilIdx = cmd.indexOf("SOIL:");
  if(soilIdx != -1) {
    int comma = cmd.indexOf(',', soilIdx);
    if(comma == -1) comma = cmd.length();
    pinSoil = parseAnalogPin(cmd.substring(soilIdx + 5, comma));
  }

  // 조도센서 타입 설정 (LIGHT_TYPE:DO 또는 LIGHT_TYPE:AO)
  int ltIdx = cmd.indexOf("LIGHT_TYPE:");
  if(ltIdx != -1) {
    int comma = cmd.indexOf(',', ltIdx);
    if(comma == -1) comma = cmd.length();
    String ltVal = cmd.substring(ltIdx + 11, comma);
    ltVal.trim();
    lightDO = (ltVal == "DO");
  }

  // 변경된 핀 번호를 적용
  updatePinModes();
}
