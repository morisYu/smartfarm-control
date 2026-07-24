/**
 * hardware.js
 * 스마트팜 하드웨어(액추에이터) 제어 모듈
 * 
 * 시리얼 통신 모듈(ArduinoSerial)을 활용하여 구체적인 하드웨어 동작을 정의합니다.
 * Blockly 블록들에서 직접 이 함수들을 호출하게 됩니다. (모듈화/추상화)
 */

window.ArduinoHW = {
    _pumpRampInterval: null,
    
    
    _currentKit: 'smartfarm',

    setCurrentKit: function(kitId) {
        this._currentKit = kitId;
    },

    _getPinStorageKey: function() {
        return 'arduino_pins_' + this._currentKit;
    },

    getPumpType: function() {
        const saved = localStorage.getItem(this._getPinStorageKey());
        if (saved) {
            try {
                const config = JSON.parse(saved);
                return config.pumpType || 'high';
            } catch(e) {}
        }
        return 'high';
    },

    /** ===================================
     *  워터 펌프 (DC 모터/릴레이) 제어
     *  =================================== */
    turnOnPump: function(dir, speed) {
        if (this._pumpRampInterval) {
            clearInterval(this._pumpRampInterval);
            this._pumpRampInterval = null;
        }

        let targetSpeed = parseInt(speed, 10);
        let currentSpeed = 0;
        let isLowType = (this.getPumpType() === 'low');
        
        // 목표 속도 도달 여부를 체크하고 명령을 전송하는 내부 함수
        const sendPumpCommand = (val) => {
            let finalSpeed = isLowType ? (255 - val) : val;
            window.ArduinoSerial.sendCommand(`PUMP:0,${finalSpeed}\n`);
        };

        // 소프트 스타트: 0부터 목표 속도까지 빠르게 서서히 증가 (돌입 전류 방지)
        this._pumpRampInterval = setInterval(() => {
            currentSpeed += 30; // 한 번에 올릴 속도 단위 (클수록 빨리 켜짐)
            if (currentSpeed >= targetSpeed) {
                currentSpeed = targetSpeed;
                sendPumpCommand(currentSpeed);
                clearInterval(this._pumpRampInterval);
                this._pumpRampInterval = null;
            } else {
                sendPumpCommand(currentSpeed);
            }
        }, 30); // 30ms 간격으로 증가
    },
    
    turnOffPump: function() {
        if (this._pumpRampInterval) {
            clearInterval(this._pumpRampInterval);
            this._pumpRampInterval = null;
        }
        let speed = 0;
        let dir = 0;
        if (this.getPumpType() === 'low') {
            // Active-Low 방식은 HIGH(255) 신호에서 꺼짐
            // 사용자가 DIR 핀에 릴레이를 연결했을 수도 있으므로, 양쪽 핀 모두 HIGH 신호를 주어 확실히 끕니다.
            speed = 255;
            dir = 1;
        }
        // Active-High: dir=0(LOW) + speed=0 → 모터 정지
        window.ArduinoSerial.sendCommand(`PUMP:${dir},${speed}\n`);
    },

    /** ===================================
     *  서보모터 (Servo Motor) 제어
     *  =================================== */

    // 서보 각도 저장 (블록코딩 읽기용)
    _servoAngles: { thumb: 90, index: 90, middle: 90, ring: 90, pinky: 90 },

    /**
     * 개별 서보모터 각도 설정
     * @param {string} finger - 손가락 이름 (thumb, index, middle, ring, pinky)
     * @param {number} angle - 각도 (0~180)
     */
    setServo: function(finger, angle) {
        let originalAngle = Math.floor(angle);
        
        if (window.currentKitId === 'handino') {
            let maxAngle = 165;
            let minAngle = (finger === 'thumb') ? 30 : 15;
            let clipped = Math.max(minAngle, Math.min(maxAngle, originalAngle));
            
            if (originalAngle !== clipped && window.isBlocklyRunning) {
                // 이미 동일한 에러를 띄웠는지 체크하여 반복 팝업 방지 (간단한 디바운스/쓰로틀링)
                const now = Date.now();
                if (!window._lastServoAlert || (now - window._lastServoAlert > 2000)) {
                    alert(`입력한 각도(${originalAngle}도)가 범위를 벗어났습니다.\n안전한 범위(${minAngle}~${maxAngle}도)로 자동 조정됩니다.`);
                    window._lastServoAlert = now;
                }
            }
            angle = clipped;
        } else {
            angle = Math.max(0, Math.min(180, originalAngle));
        }

        this._servoAngles[finger] = angle;
        window.ArduinoSerial.sendCommand(`SRV:${finger},${angle}\n`);
        window.dispatchEvent(new CustomEvent('hardware-servo-updated', { detail: { finger, angle } }));
    },

    /**
     * 모든 서보모터를 같은 각도로 설정
     * @param {number} angle - 각도 (0~180)
     */
    setAllServos: function(angle) {
        let originalAngle = Math.floor(angle);
        
        if (window.currentKitId === 'handino') {
            if ((originalAngle < 15 || originalAngle > 165) && window.isBlocklyRunning) {
                const now = Date.now();
                if (!window._lastServoAlert || (now - window._lastServoAlert > 2000)) {
                    alert(`입력한 각도(${originalAngle}도)가 범위를 벗어났습니다.\n안전한 범위(15~165도, 엄지는 30도)로 자동 조정됩니다.`);
                    window._lastServoAlert = now;
                }
            }
            
            let clipped = Math.max(15, Math.min(165, originalAngle));
            ['thumb', 'index', 'middle', 'ring', 'pinky'].forEach(finger => {
                let min = (finger === 'thumb') ? 30 : 15;
                this._servoAngles[finger] = Math.max(min, clipped);
            });
            
            window.ArduinoSerial.sendCommand(`SRV:all,${clipped}\n`);
            window.dispatchEvent(new CustomEvent('hardware-servo-updated', { detail: { finger: 'all', angle: clipped } }));
        } else {
            angle = Math.max(0, Math.min(180, originalAngle));
            ['thumb', 'index', 'middle', 'ring', 'pinky'].forEach(finger => {
                this._servoAngles[finger] = angle;
            });
            window.ArduinoSerial.sendCommand(`SRV:all,${angle}\n`);
            window.dispatchEvent(new CustomEvent('hardware-servo-updated', { detail: { finger: 'all', angle } }));
        }
    },

    /**
     * 서보 각도 읽기 (마지막 설정값)
     * @param {string} finger
     * @returns {number}
     */
    getServoAngle: function(finger) {
        return this._servoAngles[finger] || 90;
    },

    /** ===================================
     *  RGB LED 제어
     *  =================================== */
    
    getRgbType: function() {
        const saved = localStorage.getItem(this._getPinStorageKey());
        if (saved) {
            try {
                const config = JSON.parse(saved);
                return config.rgbType || 'cathode';
            } catch(e) {}
        }
        return 'cathode';
    },

    /**
     * RGB LED 색상 지정 (PWM)
     * @param {number} r 빨강 (0~255)
     * @param {number} g 초록 (0~255)
     * @param {number} b 파랑 (0~255)
     */
    setRgbLed: function(r, g, b) {
        // 값 검증
        r = Math.max(0, Math.min(255, Math.floor(r)));
        g = Math.max(0, Math.min(255, Math.floor(g)));
        b = Math.max(0, Math.min(255, Math.floor(b)));
        
        // 공통 양극(Common Anode)일 경우 값 반전
        if (this.getRgbType() === 'anode') {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
        }
        
        window.ArduinoSerial.sendCommand(`RGB:${r},${g},${b}\n`);
    },
    
    turnOffRgbLed: function() {
        if (this.getRgbType() === 'anode') {
            window.ArduinoSerial.sendCommand("RGB:255,255,255\n");
        } else {
            window.ArduinoSerial.sendCommand("RGB:0,0,0\n");
        }
    },

    /** ===================================
     *  부저 (수동 부저) 제어
     *  =================================== */
    turnOnBuzzer: function(freq = 1000) {
        window.ArduinoSerial.sendCommand(`BUZ:${freq}\n`);
    },
    
    turnOffBuzzer: function() {
        window.ArduinoSerial.sendCommand("BUZ:0\n");
    },

    /** ===================================
     *  핀(Pin) 설정 전송
     *  =================================== */
    /**
     * 웹에서 설정한 핀 번호들을 아두이노로 일괄 전송
     * CFG:PUMP:7,5,RGB:9,10,11,BUZ:6,DHT:2,LIG:A0,SOIL:A1 형식
     */
    sendPinConfig: function(config) {
        const lightType = config.lightType || 'DO';
        const cmd = `CFG:PUMP:${config.pumpDir},${config.pumpPwm},RGB:${config.rgbR},${config.rgbG},${config.rgbB},BUZ:${config.buzzer},DHT:${config.dht},LIG:${config.light},SOIL:${config.soil},LIGHT_TYPE:${lightType}\n`;
        window.ArduinoSerial.sendCommand(cmd);
    },

    /** ===================================
     *  Wrapper for smartfarm commands
     *  =================================== */
    sendCommand: function(cmd, params = {}) {
        switch (cmd) {
            case 'PUMP_ON':
                this.turnOnPump(0, params.speed || 255);
                break;
            case 'PUMP_OFF':
                this.turnOffPump();
                break;
            case 'RGB_SET':
                this.setRgbLed(params.r || 0, params.g || 0, params.b || 0);
                break;
            case 'RGB_OFF':
                this.turnOffRgbLed();
                break;
            case 'BUZZER_ON':
                this.turnOnBuzzer(params.freq || 1000);
                break;
            case 'BUZZER_OFF':
                this.turnOffBuzzer();
                break;
            case 'PING':
                window.ArduinoSerial.sendCommand('PING\n');
                break;
            default:
                console.warn('Unknown command: ' + cmd);
        }
    }
};

window.SmartFarmHW = window.ArduinoHW;
