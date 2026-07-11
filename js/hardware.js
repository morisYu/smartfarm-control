/**
 * hardware.js
 * 스마트팜 하드웨어(액추에이터) 제어 모듈
 * 
 * 시리얼 통신 모듈(SmartFarmSerial)을 활용하여 구체적인 하드웨어 동작을 정의합니다.
 * Blockly 블록들에서 직접 이 함수들을 호출하게 됩니다. (모듈화/추상화)
 */

window.SmartFarmHW = {
    _pumpRampInterval: null,
    
    
    getPumpType: function() {
        const saved = localStorage.getItem('smartfarm_pins');
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
            window.SmartFarmSerial.sendCommand(`PUMP:0,${finalSpeed}\n`);
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
        window.SmartFarmSerial.sendCommand(`PUMP:${dir},${speed}\n`);
    },

    /** ===================================
     *  RGB LED 제어
     *  =================================== */
    
    getRgbType: function() {
        const saved = localStorage.getItem('smartfarm_pins');
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
        
        window.SmartFarmSerial.sendCommand(`RGB:${r},${g},${b}\n`);
    },
    
    turnOffRgbLed: function() {
        if (this.getRgbType() === 'anode') {
            window.SmartFarmSerial.sendCommand("RGB:255,255,255\n");
        } else {
            window.SmartFarmSerial.sendCommand("RGB:0,0,0\n");
        }
    },

    /** ===================================
     *  부저 (수동 부저) 제어
     *  =================================== */
    turnOnBuzzer: function(freq = 1000) {
        window.SmartFarmSerial.sendCommand(`BUZ:${freq}\n`);
    },
    
    turnOffBuzzer: function() {
        window.SmartFarmSerial.sendCommand("BUZ:0\n");
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
        window.SmartFarmSerial.sendCommand(cmd);
    }
};
