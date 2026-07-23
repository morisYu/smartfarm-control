#include <Servo.h>

Servo servoThumb;
Servo servoIndex;
Servo servoMiddle;
Servo servoRing;
Servo servoPinky;

// 동적 핀 설정 변수 (기본값 설정)
int pinThumb = 12;
int pinIndex = 10;
int pinMiddle = 9;
int pinRing = 6;
int pinPinky = 2;

Servo* getServoByName(String name) {
  if (name == "thumb") return &servoThumb;
  if (name == "index") return &servoIndex;
  if (name == "middle") return &servoMiddle;
  if (name == "ring") return &servoRing;
  if (name == "pinky") return &servoPinky;
  return nullptr;
}

// 안전한 각도 제한 함수
int constrainAngle(String finger, int angle) {
  int maxAngle = 165;
  int minAngle = (finger == "thumb") ? 30 : 15;
  
  if (angle < minAngle) return minAngle;
  if (angle > maxAngle) return maxAngle;
  return angle;
}

void setServoAngleSafely(String finger, int angle) {
  Servo* s = getServoByName(finger);
  if (s != nullptr) {
    s->write(constrainAngle(finger, angle));
  }
}

void setup() {
  Serial.begin(115200);

  // 서보 핀 연결
  servoThumb.attach(pinThumb);
  servoIndex.attach(pinIndex);
  servoMiddle.attach(pinMiddle);
  servoRing.attach(pinRing);
  servoPinky.attach(pinPinky);

  // 초기 상태: 모든 손가락 165도로 활짝 펴기
  setServoAngleSafely("thumb", 165);
  setServoAngleSafely("index", 165);
  setServoAngleSafely("middle", 165);
  setServoAngleSafely("ring", 165);
  setServoAngleSafely("pinky", 165);
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("SRV:")) {
      int comma = cmd.indexOf(',');
      if (comma != -1) {
        String target = cmd.substring(4, comma);
        int angle = cmd.substring(comma + 1).toInt();

        if (target == "all") {
          setServoAngleSafely("thumb", angle);
          setServoAngleSafely("index", angle);
          setServoAngleSafely("middle", angle);
          setServoAngleSafely("ring", angle);
          setServoAngleSafely("pinky", angle);
        } else {
          setServoAngleSafely(target, angle);
        }
      }
    }
  }
}
