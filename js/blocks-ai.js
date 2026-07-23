(function() {
    // 1. TTS 블록
    Blockly.Blocks['ai_tts'] = {
        init: function() {
            this.appendValueInput('TEXT')
                .setCheck('String')
                .appendField('🗣️');
            this.appendDummyInput()
                .appendField('읽어주기 (끝날 때까지 대기)');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#e83e8c');
            this.setTooltip('입력한 텍스트를 음성으로 읽습니다.');
        }
    };
    jsGen.forBlock['ai_tts'] = function(block, generator) {
        const text = generator.valueToCode(block, 'TEXT', generator.ORDER_ATOMIC) || '""';
        return `await window.AI.speakText(String(${text}));\n`;
    };

    // 2. 손 모양 인식 시작
    Blockly.Blocks['ai_hand_start'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('🖐️ 카메라 켜고 손 인식 모델 불러오기');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#e83e8c');
        }
    };
    jsGen.forBlock['ai_hand_start'] = function(block, generator) {
        return `await window.AI.startHandTracking();\n`;
    };

    // 3. 손 모양 인식 중지
    Blockly.Blocks['ai_hand_stop'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('🖐️ 카메라 끄고 손 인식 중지하기');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#e83e8c');
        }
    };
    jsGen.forBlock['ai_hand_stop'] = function(block, generator) {
        return `window.AI.stopHandTracking();\n`;
    };

    // 4. 단발성 인식(스냅샷)
    Blockly.Blocks['ai_hand_recognize'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('📸 현재 화면에서 손 모양 1회 인식하기');
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#e83e8c');
            this.setTooltip('카메라에서 1프레임을 가져와 인공지능 분석을 1회 수행합니다. 가벼운 구동에 적합합니다.');
        }
    };
    jsGen.forBlock['ai_hand_recognize'] = function(block, generator) {
        return `await window.AI.recognizeHand();\n`;
    };

    // 5. 특정 손가락 굽힘 각도 (Value)
    Blockly.Blocks['ai_hand_get_angle'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('🖐️')
                .appendField(new Blockly.FieldDropdown([
                    ['엄지', 'thumb'],
                    ['검지', 'index'],
                    ['중지', 'middle'],
                    ['약지', 'ring'],
                    ['소지', 'pinky']
                ]), 'FINGER')
                .appendField('굽힘 정도 (0~180)');
            this.setOutput(true, 'Number');
            this.setColour('#e83e8c');
        }
    };
    jsGen.forBlock['ai_hand_get_angle'] = function(block, generator) {
        const finger = block.getFieldValue('FINGER');
        return [`window.AI.getFingerAngle('${finger}')`, jsGen.ORDER_ATOMIC];
    };

    // 6. 특정 손가락 접힘 여부 (Boolean)
    Blockly.Blocks['ai_hand_is_folded'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('🖐️')
                .appendField(new Blockly.FieldDropdown([
                    ['엄지', 'thumb'],
                    ['검지', 'index'],
                    ['중지', 'middle'],
                    ['약지', 'ring'],
                    ['소지', 'pinky']
                ]), 'FINGER')
                .appendField('가 접혔는가?');
            this.setOutput(true, 'Boolean');
            this.setColour('#e83e8c');
        }
    };
    jsGen.forBlock['ai_hand_is_folded'] = function(block, generator) {
        const finger = block.getFieldValue('FINGER');
        return [`window.AI.isFingerFolded('${finger}')`, jsGen.ORDER_ATOMIC];
    };

    // 7. 사전 정의된 제스처 여부 (Boolean)
    Blockly.Blocks['ai_hand_is_gesture'] = {
        init: function() {
            this.appendDummyInput()
                .appendField('🖐️ 인식된 손 모양이')
                .appendField(new Blockly.FieldDropdown([
                    ['바위 (주먹)', 'rock'],
                    ['가위', 'scissors'],
                    ['보 (편 손)', 'paper'],
                    ['사랑해 (ILY)', 'love']
                ]), 'GESTURE')
                .appendField('인가?');
            this.setOutput(true, 'Boolean');
            this.setColour('#e83e8c');
        }
    };
    jsGen.forBlock['ai_hand_is_gesture'] = function(block, generator) {
        const gesture = block.getFieldValue('GESTURE');
        return [`window.AI.isGesture('${gesture}')`, jsGen.ORDER_ATOMIC];
    };

})();
