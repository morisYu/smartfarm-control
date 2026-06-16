/**
 * blocks.js
 * 스마트팜 커스텀 Blockly 블록 정의 및 코드 생성기 (JavaScript / C)
 */

// --- 1. 커스텀 블록 정의 ---

Blockly.defineBlocksWithJsonArray([
    // 시작 블록 (Hat block)
    {
        "type": "sf_start",
        "message0": "▶ 시작하기",
        "nextStatement": null,
        "colour": "#FFBF00",
        "tooltip": "여기에 연결된 블록들이 실행됩니다.",
        "helpUrl": ""
    },
    // 센서 읽기: 온도
    {
        "type": "sf_get_temp",
        "message0": "🌡️ 온도 읽기",
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "현재 온도를 읽어옵니다.",
        "helpUrl": ""
    },
    // 센서 읽기: 습도
    {
        "type": "sf_get_humid",
        "message0": "💧 습도 읽기",
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "현재 습도를 읽어옵니다.",
        "helpUrl": ""
    },
    // 센서 읽기: 조도
    {
        "type": "sf_get_light",
        "message0": "☀️ 조도 읽기",
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "현재 조도(빛의 밝기)를 읽어옵니다.",
        "helpUrl": ""
    },
    // 센서 읽기: 토양 수분
    {
        "type": "sf_get_soil",
        "message0": "🌱 토양 수분 읽기",
        "output": "Number",
        "colour": "#4CBFE6",
        "tooltip": "현재 토양 수분을 읽어옵니다.",
        "helpUrl": ""
    },
    // 액추에이터: 펌프 켜기
    {
        "type": "sf_pump_on",
        "message0": "워터 펌프 켜기 (속도 %1)",
        "args0": [
            {
                "type": "input_value",
                "name": "SPEED",
                "check": "Number"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 230,
        "tooltip": "워터 펌프를 지정한 속도(0~255)로 가동합니다.",
        "helpUrl": ""
    },
    // 액추에이터: 펌프 끄기
    {
        "type": "sf_pump_off",
        "message0": "워터 펌프 끄기",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 230,
        "tooltip": "워터 펌프를 정지합니다.",
        "helpUrl": ""
    },
    // 액추에이터: RGB 설정
    {
        "type": "sf_rgb_set",
        "message0": "RGB LED 켜기 (R %1 G %2 B %3)",
        "args0": [
            { "type": "input_value", "name": "R", "check": "Number" },
            { "type": "input_value", "name": "G", "check": "Number" },
            { "type": "input_value", "name": "B", "check": "Number" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 280,
        "tooltip": "RGB LED의 색상을 지정합니다 (0~255).",
        "helpUrl": ""
    },
    // 액추에이터: RGB 끄기
    {
        "type": "sf_rgb_off",
        "message0": "RGB LED 끄기",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 280,
        "tooltip": "RGB LED를 끕니다.",
        "helpUrl": ""
    },
    // 액추에이터: 부저 켜기
    {
        "type": "sf_buzzer_on",
        "message0": "부저 소리 켜기 (주파수 %1 Hz)",
        "args0": [
            {
                "type": "input_value",
                "name": "FREQ",
                "check": "Number"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "부저를 특정 주파수(Hz)로 울립니다.",
        "helpUrl": ""
    },
    // 액추에이터: 부저 끄기
    {
        "type": "sf_buzzer_off",
        "message0": "부저 소리 끄기",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "부저 소리를 끕니다.",
        "helpUrl": ""
    },
    // 지연: N초 대기
    {
        "type": "sf_delay",
        "message0": "%1 초 동안 기다리기",
        "args0": [
            {
                "type": "input_value",
                "name": "SEC",
                "check": "Number"
            }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#0FBD8C",
        "tooltip": "지정한 시간(초)만큼 코드 실행을 일시 정지합니다.",
        "helpUrl": ""
    },
    // 반복: 계속 반복하기
    {
        "type": "sf_forever",
        "message0": "계속 반복하기 %1 %2",
        "args0": [
            { "type": "input_dummy" },
            { "type": "input_statement", "name": "DO" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#0FBD8C",
        "tooltip": "내부에 있는 블록들을 무한히 반복 실행합니다.",
        "helpUrl": ""
    }
]);


// --- 2. JavaScript 코드 제너레이터 (브라우저 실행용) ---

const jsGen = (typeof javascriptGenerator !== 'undefined') ? javascriptGenerator : Blockly.JavaScript;
jsGen.forBlock = jsGen.forBlock || jsGen;

jsGen.forBlock['sf_start'] = function(block) {
    // 시작 블록 자체는 아무 동작도 하지 않으며, 하위 블록들로 자연스럽게 넘어갑니다.
    return '\n';
};

jsGen.forBlock['sf_get_temp'] = function(block) {
    return ['Number(document.getElementById("val-temp").textContent) || 0', jsGen.ORDER_ATOMIC];
};

jsGen.forBlock['sf_get_humid'] = function(block) {
    return ['Number(document.getElementById("val-humid").textContent) || 0', jsGen.ORDER_ATOMIC];
};

jsGen.forBlock['sf_get_light'] = function(block) {
    return ['Number(document.getElementById("val-light").textContent) || 0', jsGen.ORDER_ATOMIC];
};

jsGen.forBlock['sf_get_soil'] = function(block) {
    return ['Number(document.getElementById("val-soil").textContent) || 0', jsGen.ORDER_ATOMIC];
};

jsGen.forBlock['sf_pump_on'] = function(block) {
    const speed = jsGen.valueToCode(block, 'SPEED', jsGen.ORDER_ATOMIC) || '0';
    return `window.SmartFarmHW.turnOnPump(0, ${speed});\n`;
};

jsGen.forBlock['sf_pump_off'] = function(block) {
    return `window.SmartFarmHW.turnOffPump();\n`;
};

jsGen.forBlock['sf_rgb_set'] = function(block) {
    const r = jsGen.valueToCode(block, 'R', jsGen.ORDER_ATOMIC) || '0';
    const g = jsGen.valueToCode(block, 'G', jsGen.ORDER_ATOMIC) || '0';
    const b = jsGen.valueToCode(block, 'B', jsGen.ORDER_ATOMIC) || '0';
    return `window.SmartFarmHW.setRgbLed(${r}, ${g}, ${b});\n`;
};

jsGen.forBlock['sf_rgb_off'] = function(block) {
    return `window.SmartFarmHW.turnOffRgbLed();\n`;
};

jsGen.forBlock['sf_buzzer_on'] = function(block) {
    const freq = jsGen.valueToCode(block, 'FREQ', jsGen.ORDER_ATOMIC) || '1000';
    return `window.SmartFarmHW.turnOnBuzzer(${freq});\n`;
};

jsGen.forBlock['sf_buzzer_off'] = function(block) {
    return `window.SmartFarmHW.turnOffBuzzer();\n`;
};

jsGen.STATEMENT_PREFIX = 'if (window.__isBlocklyCancelled) throw new Error("Cancelled");\n';

jsGen.forBlock['sf_delay'] = function(block) {
    const sec = jsGen.valueToCode(block, 'SEC', jsGen.ORDER_ATOMIC) || '1';
    return `await new Promise(resolve => {\n` +
           `  let totalMs = (${sec}) * 1000;\n` +
           `  let elapsed = 0;\n` +
           `  let interval = setInterval(() => {\n` +
           `    elapsed += 50;\n` +
           `    if (window.__isBlocklyCancelled || elapsed >= totalMs) {\n` +
           `      clearInterval(interval);\n` +
           `      resolve();\n` +
           `    }\n` +
           `  }, 50);\n` +
           `});\n`;
};

jsGen.forBlock['sf_forever'] = function(block) {
    const branch = Blockly.JavaScript.statementToCode(block, 'DO');
    // 무한 루프 시 브라우저 멈춤 방지 및 강제 종료를 위한 체크
    return `while (!window.__isBlocklyCancelled) {\n${branch}\n  await new Promise(r => setTimeout(r, 10));\n}\n`;
};


// --- 3. Arduino C 코드 제너레이터 (미리보기/업로드용) ---

Blockly.C = new Blockly.Generator('C');
Blockly.C.forBlock = Blockly.C.forBlock || Blockly.C;
Blockly.C.ORDER_ATOMIC = 0;
Blockly.C.ORDER_NONE = 99;

Blockly.C.init = function(workspace) {};
Blockly.C.finish = function(code) {
    return `void setup() {\n  // 핀 초기화 코드는 여기에 위치합니다.\n}\n\nvoid loop() {\n${code}}\n`;
};

Blockly.C.scrub_ = function(block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : Blockly.C.blockToCode(nextBlock);
    return code + nextCode;
};

// 숫자 블록
Blockly.C.forBlock['math_number'] = function(block) {
    const code = Number(block.getFieldValue('NUM'));
    return [code, Blockly.C.ORDER_ATOMIC];
};

// 변수
Blockly.C.forBlock['variables_get'] = function(block) {
    const name = Blockly.C.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    return [name, Blockly.C.ORDER_ATOMIC];
};
Blockly.C.forBlock['variables_set'] = function(block) {
    const name = Blockly.C.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    const argument0 = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_ATOMIC) || '0';
    return `float ${name} = ${argument0};\n`;
};

// 조건문
Blockly.C.forBlock['controls_if'] = function(block) {
    let n = 0;
    let code = '', branchCode, conditionCode;
    do {
        conditionCode = Blockly.C.valueToCode(block, 'IF' + n, Blockly.C.ORDER_NONE) || 'false';
        branchCode = Blockly.C.statementToCode(block, 'DO' + n);
        code += (n > 0 ? ' else ' : '') + `if (${conditionCode}) {\n${branchCode}}`;
        ++n;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) {
        branchCode = Blockly.C.statementToCode(block, 'ELSE');
        code += ` else {\n${branchCode}}`;
    }
    return code + '\n';
};

// 비교 연산
Blockly.C.forBlock['logic_compare'] = function(block) {
    const OPERATORS = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
    const operator = OPERATORS[block.getFieldValue('OP')];
    const argument0 = Blockly.C.valueToCode(block, 'A', Blockly.C.ORDER_ATOMIC) || '0';
    const argument1 = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_ATOMIC) || '0';
    return [`${argument0} ${operator} ${argument1}`, Blockly.C.ORDER_ATOMIC];
};

// 논리 연산
Blockly.C.forBlock['logic_operation'] = function(block) {
    const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
    const argument0 = Blockly.C.valueToCode(block, 'A', Blockly.C.ORDER_ATOMIC) || 'false';
    const argument1 = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_ATOMIC) || 'false';
    return [`${argument0} ${operator} ${argument1}`, Blockly.C.ORDER_ATOMIC];
};

// 시작 블록 (C)
Blockly.C.forBlock['sf_start'] = function(block) {
    return '\n';
};

// 커스텀 블록 (C)
Blockly.C.forBlock['sf_get_temp'] = function(block) { return ['getTemperature()', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['sf_get_humid'] = function(block) { return ['getHumidity()', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['sf_get_light'] = function(block) { return ['analogRead(A0)', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['sf_get_soil'] = function(block) { return ['analogRead(A1)', Blockly.C.ORDER_ATOMIC]; };

Blockly.C.forBlock['sf_pump_on'] = function(block) {
    const speed = Blockly.C.valueToCode(block, 'SPEED', Blockly.C.ORDER_ATOMIC) || '0';
    return `  digitalWrite(7, HIGH);\n  analogWrite(5, ${speed});\n`;
};
Blockly.C.forBlock['sf_pump_off'] = function(block) {
    return `  digitalWrite(7, LOW);\n  analogWrite(5, 0);\n`;
};

Blockly.C.forBlock['sf_rgb_set'] = function(block) {
    const r = Blockly.C.valueToCode(block, 'R', Blockly.C.ORDER_ATOMIC) || '0';
    const g = Blockly.C.valueToCode(block, 'G', Blockly.C.ORDER_ATOMIC) || '0';
    const b = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_ATOMIC) || '0';
    return `  analogWrite(9, ${r});\n  analogWrite(10, ${g});\n  analogWrite(11, ${b});\n`;
};
Blockly.C.forBlock['sf_rgb_off'] = function(block) {
    return `  analogWrite(9, 0);\n  analogWrite(10, 0);\n  analogWrite(11, 0);\n`;
};

Blockly.C.forBlock['sf_buzzer_on'] = function(block) {
    const freq = Blockly.C.valueToCode(block, 'FREQ', Blockly.C.ORDER_ATOMIC) || '1000';
    return `  tone(6, ${freq});\n`;
};
Blockly.C.forBlock['sf_buzzer_off'] = function(block) {
    return `  noTone(6);\n`;
};

Blockly.C.forBlock['sf_delay'] = function(block) {
    const sec = Blockly.C.valueToCode(block, 'SEC', Blockly.C.ORDER_ATOMIC) || '1';
    return `  delay((${sec}) * 1000);\n`;
};

Blockly.C.forBlock['sf_forever'] = function(block) {
    const branch = Blockly.C.statementToCode(block, 'DO');
    return `  while (true) {\n${branch}  }\n`;
};
