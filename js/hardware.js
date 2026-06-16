/**
 * hardware.js
 * 스마트팜 하드웨어(액추에이터) 제어 모듈
 * 
 * 시리얼 통신 모듈(SmartFarmSerial)을 활용하여 구체적인 하드웨어 동작을 정의합니다.
 * Blockly 블록들에서 직접 이 함수들을 호출하게 됩니다. (모듈화/추상화)
 */

window.SmartFarmHW = {
    
    /** ===================================
     *  워터 펌프 (DC 모터) 제어
     *  =================================== */
    turnOnPump: function(dir, speed) {
        window.SmartFarmSerial.sendCommand(`PUMP:${dir},${speed}\n`);
    },
    
    turnOffPump: function() {
        window.SmartFarmSerial.sendCommand("PUMP:0,0\n");
    },

    /** ===================================
     *  RGB LED 제어
     *  =================================== */
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
        
        // NEO: -> RGB: 로 변경 (아두이노 코드에 맞춰 파싱 필요)
        window.SmartFarmSerial.sendCommand(`RGB:${r},${g},${b}\n`);
    },
    
    turnOffRgbLed: function() {
        window.SmartFarmSerial.sendCommand("RGB:0,0,0\n");
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
        const cmd = `CFG:PUMP:${config.pumpDir},${config.pumpPwm},RGB:${config.rgbR},${config.rgbG},${config.rgbB},BUZ:${config.buzzer},DHT:${config.dht},LIG:${config.light},SOIL:${config.soil}\n`;
        window.SmartFarmSerial.sendCommand(cmd);
    }
};
