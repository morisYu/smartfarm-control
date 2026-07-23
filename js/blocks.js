/**
 * blocks.js
 * 공통 Blockly 블록 정의 및 코드 생성기
 * 키트 전용 블록은 각 js/kits/*.js 에서 정의됩니다.
 */

// --- 1. 커스텀 블록 정의 ---

Blockly.defineBlocksWithJsonArray([
    // 시작 블록 (Hat block)
    {
        "type": "ard_start",
        "message0": "▶ 시작하기",
        "nextStatement": null,
        "colour": "#FFBF00",
        "tooltip": "여기에 연결된 블록들이 실행됩니다.",
        "helpUrl": ""
    },
    // 지연: N초 대기
    {
        "type": "ard_delay",
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
        "type": "ard_forever",
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

/**
 * 키트에서 정의한 블록을 Blockly에 등록합니다.
 * @param {Object} kit - KitRegistry에서 가져온 키트 설정 객체
 */
window.registerKitBlocks = function(kit) {
    if (!kit) return;
    
    // 1. 블록 정의 등록
    if (kit.blockDefs && kit.blockDefs.length > 0) {
        Blockly.defineBlocksWithJsonArray(kit.blockDefs);
    }
    
    // 2. JS 코드 생성기 등록
    const jsGen = (typeof javascriptGenerator !== 'undefined') ? javascriptGenerator : Blockly.JavaScript;
    if (kit.jsGenerators) {
        Object.keys(kit.jsGenerators).forEach(blockType => {
            jsGen.forBlock[blockType] = function(block) {
                return kit.jsGenerators[blockType](block, jsGen);
            };
        });
    }
    
    // 3. C 코드 생성기 등록
    if (kit.cGenerators) {
        Object.keys(kit.cGenerators).forEach(blockType => {
            Blockly.C.forBlock[blockType] = function(block) {
                return kit.cGenerators[blockType](block, Blockly.C);
            };
        });
    }
};


// --- 2. JavaScript 코드 제너레이터 (브라우저 실행용) ---

const jsGen = (typeof javascriptGenerator !== 'undefined') ? javascriptGenerator : Blockly.JavaScript;
jsGen.forBlock = jsGen.forBlock || jsGen;

jsGen.forBlock['ard_start'] = function(block) {
    // 시작 블록 자체는 아무 동작도 하지 않으며, 하위 블록들로 자연스럽게 넘어갑니다.
    return '\n';
};

jsGen.STATEMENT_PREFIX = 'if (window.__isBlocklyCancelled) throw new Error("Cancelled");\n';

jsGen.forBlock['ard_delay'] = function(block) {
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

jsGen.forBlock['ard_forever'] = function(block) {
    const branch = jsGen.statementToCode(block, 'DO');
    // 무한 루프 시 브라우저 멈춤 방지 및 강제 종료를 위한 체크
    return `while (!window.__isBlocklyCancelled) {\n${branch}\n  await new Promise(r => setTimeout(r, 10));\n}\n`;
};


// --- 3. Arduino C 코드 제너레이터 (미리보기/업로드용) ---

Blockly.C = new Blockly.Generator('C');
Blockly.C.forBlock = Blockly.C.forBlock || Blockly.C;
Blockly.C.ORDER_ATOMIC        = 0;
Blockly.C.ORDER_UNARY_PREFIX  = 2;
Blockly.C.ORDER_MULTIPLICATIVE= 5;
Blockly.C.ORDER_ADDITIVE      = 6;
Blockly.C.ORDER_RELATIONAL    = 8;
Blockly.C.ORDER_EQUALITY      = 9;
Blockly.C.ORDER_LOGICAL_AND   = 13;
Blockly.C.ORDER_LOGICAL_OR    = 14;
Blockly.C.ORDER_NONE          = 99;

Blockly.C.init = function(workspace) {
    if (!this.nameDB_) {
        this.nameDB_ = new Blockly.Names(workspace.variableMap_);
    } else {
        this.nameDB_.reset();
    }
    this.nameDB_.setVariableMap(workspace.variableMap_);
    this.nameDB_.populateVariables(workspace);
    this.nameDB_.populateProcedures(workspace);

    this.definitions_ = Object.create(null);
    this.setups_ = Object.create(null);

    // 코드 생성 시작 시 루프 변수 카운터 초기화 (i, j, k, l, m ...)
    Blockly.C._loopVarIndex = 0;
};
// 루프 변수명 생성 헬퍼: 0→'i', 1→'j', 2→'k', ..., 17→'z', 18→'i2', ...
Blockly.C._getLoopVar = function() {
    const BASE = 'ijklmnopqrstuvwxyz';
    const idx  = Blockly.C._loopVarIndex++;
    const letter = BASE[idx % BASE.length];
    const suffix = Math.floor(idx / BASE.length) || '';
    return letter + suffix;
};
Blockly.C.finish = function(code) {
    return `void setup() {\n  // 핀 초기화 코드는 여기에 위치합니다.\n}\n\nvoid loop() {\n${code}}\n`;
};
Blockly.C.scrub_ = function(block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : Blockly.C.blockToCode(nextBlock);
    return code + nextCode;
};

// ── 숫자 ──────────────────────────────────────────────────────────────────
Blockly.C.forBlock['math_number'] = function(block) {
    return [Number(block.getFieldValue('NUM')), Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_arithmetic'] = function(block) {
    const OPS = { ADD:['+',Blockly.C.ORDER_ADDITIVE], MINUS:['-',Blockly.C.ORDER_ADDITIVE],
                  MULTIPLY:['*',Blockly.C.ORDER_MULTIPLICATIVE], DIVIDE:['/',Blockly.C.ORDER_MULTIPLICATIVE],
                  POWER:[null,Blockly.C.ORDER_NONE] };
    const op = block.getFieldValue('OP');
    const [operator, order] = OPS[op];
    const a = Blockly.C.valueToCode(block, 'A', order) || '0';
    const b = Blockly.C.valueToCode(block, 'B', order) || '0';
    if (op === 'POWER') return [`pow(${a}, ${b})`, Blockly.C.ORDER_ATOMIC];
    return [`${a} ${operator} ${b}`, order];
};

Blockly.C.forBlock['math_single'] = function(block) {
    const op  = block.getFieldValue('OP');
    const arg = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_UNARY_PREFIX) || '0';
    const MAP = { ROOT:`sqrt(${arg})`, ABS:`abs(${arg})`, NEG:`-${arg}`,
                  LN:`log(${arg})`, LOG10:`log10(${arg})`, EXP:`exp(${arg})`, POW10:`pow(10,${arg})` };
    return [MAP[op] || arg, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_trig'] = function(block) {
    const op  = block.getFieldValue('OP');
    const arg = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_NONE) || '0';
    const MAP = { SIN:`sin((${arg})*PI/180.0)`, COS:`cos((${arg})*PI/180.0)`,
                  TAN:`tan((${arg})*PI/180.0)`, ASIN:`asin(${arg})*180.0/PI`,
                  ACOS:`acos(${arg})*180.0/PI`, ATAN:`atan(${arg})*180.0/PI` };
    return [MAP[op] || arg, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_constant'] = function(block) {
    const MAP = { PI:'PI', E:'2.71828183', GOLDEN_RATIO:'1.61803399',
                  SQRT2:'sqrt(2)', SQRT1_2:'sqrt(0.5)', INFINITY:'INFINITY' };
    return [MAP[block.getFieldValue('CONSTANT')] || '0', Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_number_property'] = function(block) {
    const num  = Blockly.C.valueToCode(block, 'NUMBER_TO_CHECK', Blockly.C.ORDER_NONE) || '0';
    const prop = block.getFieldValue('PROPERTY');
    if (prop === 'DIVISIBLE_BY') {
        const div = Blockly.C.valueToCode(block, 'DIVISOR', Blockly.C.ORDER_NONE) || '1';
        return [`((int)(${num})%(int)(${div})==0)`, Blockly.C.ORDER_ATOMIC];
    }
    const MAP = { EVEN:`((int)(${num})%2==0)`, ODD:`((int)(${num})%2!=0)`,
                  POSITIVE:`(${num}>0)`, NEGATIVE:`(${num}<0)` };
    return [MAP[prop] || 'false', Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_round'] = function(block) {
    const op  = block.getFieldValue('OP');
    const arg = Blockly.C.valueToCode(block, 'NUM', Blockly.C.ORDER_NONE) || '0';
    const MAP = { ROUND:`round(${arg})`, ROUNDUP:`ceil(${arg})`, ROUNDDOWN:`floor(${arg})` };
    return [MAP[op], Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_on_list'] = function(block) {
    return [`0 /* math_on_list: 아두이노에서 지원되지 않습니다 */`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_modulo'] = function(block) {
    const a = Blockly.C.valueToCode(block, 'DIVIDEND', Blockly.C.ORDER_MULTIPLICATIVE) || '0';
    const b = Blockly.C.valueToCode(block, 'DIVISOR',  Blockly.C.ORDER_MULTIPLICATIVE) || '1';
    return [`(int)(${a})%(int)(${b})`, Blockly.C.ORDER_MULTIPLICATIVE];
};

Blockly.C.forBlock['math_constrain'] = function(block) {
    const val  = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || '0';
    const low  = Blockly.C.valueToCode(block, 'LOW',   Blockly.C.ORDER_NONE) || '0';
    const high = Blockly.C.valueToCode(block, 'HIGH',  Blockly.C.ORDER_NONE) || '255';
    return [`constrain(${val},${low},${high})`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_random_int'] = function(block) {
    const from = Blockly.C.valueToCode(block, 'FROM', Blockly.C.ORDER_NONE) || '0';
    const to   = Blockly.C.valueToCode(block, 'TO',   Blockly.C.ORDER_NONE) || '100';
    return [`random(${from},${to}+1)`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['math_random_float'] = function(block) {
    return ['((float)random(0,10001)/10000.0)', Blockly.C.ORDER_ATOMIC];
};

// ── 문자열 ────────────────────────────────────────────────────────────────
Blockly.C.forBlock['text'] = function(block) {
    const code = block.getFieldValue('TEXT').replace(/"/g, '\\"');
    return [`"${code}"`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_join'] = function(block) {
    const parts = [];
    for (let i = 0; i < block.itemCount_; i++) {
        parts.push(Blockly.C.valueToCode(block, 'ADD' + i, Blockly.C.ORDER_NONE) || '""');
    }
    if (!parts.length) return ['""', Blockly.C.ORDER_ATOMIC];
    return [`(${parts.map((p,i)=> i===0 ? `String(${p})` : `+String(${p})`).join('')})`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_append'] = function(block) {
    const name = block.getFieldValue('VAR');
    const text = Blockly.C.valueToCode(block, 'TEXT', Blockly.C.ORDER_NONE) || '""';
    return `${name} += String(${text});\n`;
};

Blockly.C.forBlock['text_length'] = function(block) {
    const arg = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || '""';
    return [`String(${arg}).length()`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_isEmpty'] = function(block) {
    const arg = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || '""';
    return [`(String(${arg}).length()==0)`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_indexOf'] = function(block) {
    const str = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || '""';
    const sub = Blockly.C.valueToCode(block, 'FIND',  Blockly.C.ORDER_NONE) || '""';
    return [`String(${str}).indexOf(${sub})`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_charAt'] = function(block) {
    const str = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || '""';
    const idx = Blockly.C.valueToCode(block, 'AT',    Blockly.C.ORDER_NONE) || '0';
    return [`String(${str}).charAt(${idx})`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_getSubstring'] = function(block) {
    const str = Blockly.C.valueToCode(block, 'STRING', Blockly.C.ORDER_NONE) || '""';
    const at1 = Blockly.C.valueToCode(block, 'AT1',    Blockly.C.ORDER_NONE) || '0';
    const at2 = Blockly.C.valueToCode(block, 'AT2',    Blockly.C.ORDER_NONE) || '0';
    return [`String(${str}).substring(${at1},${at2})`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_changeCase'] = function(block) {
    const arg = Blockly.C.valueToCode(block, 'TEXT', Blockly.C.ORDER_NONE) || '""';
    return [`String(${arg}) /* case change not supported in Arduino */`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['text_trim'] = function(block) {
    const arg = Blockly.C.valueToCode(block, 'TEXT', Blockly.C.ORDER_NONE) || '""';
    return [`String(${arg}) /* trim not supported in Arduino */`, Blockly.C.ORDER_ATOMIC];
};

// ── 리스트 (아두이노 배열로 매핑) ─────────────────────────────────────────
Blockly.C.forBlock['lists_create_with'] = function(block) {
    const elems = [];
    for (let i = 0; i < block.itemCount_; i++) {
        elems.push(Blockly.C.valueToCode(block, 'ADD' + i, Blockly.C.ORDER_NONE) || '0');
    }
    return [`{${elems.join(', ')}}`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['lists_repeat'] = function(block) {
    const item  = Blockly.C.valueToCode(block, 'ITEM', Blockly.C.ORDER_NONE) || '0';
    const times = Blockly.C.valueToCode(block, 'NUM',  Blockly.C.ORDER_NONE) || '0';
    return [`/* lists_repeat(${item},${times}) - 아두이노에서 배열을 직접 선언하세요 */`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['lists_length']    = function(block) { return ['0 /* lists_length */', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['lists_isEmpty']   = function(block) { return ['false /* lists_isEmpty */', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['lists_indexOf']   = function(block) { return ['0 /* lists_indexOf */', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['lists_getSublist']= function(block) { return ['0 /* lists_getSublist */', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['lists_split']     = function(block) { return ['0 /* lists_split */', Blockly.C.ORDER_ATOMIC]; };
Blockly.C.forBlock['lists_sort']      = function(block) { return ['0 /* lists_sort */', Blockly.C.ORDER_ATOMIC]; };

Blockly.C.forBlock['lists_getIndex'] = function(block) {
    const list = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || 'arr';
    const idx  = Blockly.C.valueToCode(block, 'AT',    Blockly.C.ORDER_NONE) || '0';
    return [`${list}[${idx}]`, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['lists_setIndex'] = function(block) {
    const list = Blockly.C.valueToCode(block, 'LIST', Blockly.C.ORDER_NONE) || 'arr';
    const idx  = Blockly.C.valueToCode(block, 'AT',   Blockly.C.ORDER_NONE) || '0';
    const val  = Blockly.C.valueToCode(block, 'TO',   Blockly.C.ORDER_NONE) || '0';
    return `${list}[${idx}] = ${val};\n`;
};

// ── 변수 ──────────────────────────────────────────────────────────────────
Blockly.C.forBlock['variables_get'] = function(block) {
    const name = Blockly.C.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    return [name, Blockly.C.ORDER_ATOMIC];
};
Blockly.C.forBlock['variables_set'] = function(block) {
    const name  = Blockly.C.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    const value = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_ATOMIC) || '0';
    return `float ${name} = ${value};\n`;
};

// ── 조건문 ────────────────────────────────────────────────────────────────
Blockly.C.forBlock['controls_if'] = function(block) {
    let n = 0, code = '', branch, cond;
    do {
        cond   = Blockly.C.valueToCode(block, 'IF' + n, Blockly.C.ORDER_NONE) || 'false';
        branch = Blockly.C.statementToCode(block, 'DO' + n);
        code  += (n > 0 ? ' else ' : '') + `if (${cond}) {\n${branch}}`;
        ++n;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) {
        code += ` else {\n${Blockly.C.statementToCode(block, 'ELSE')}}`;
    }
    return code + '\n';
};

// ── 비교 / 논리 ───────────────────────────────────────────────────────────
Blockly.C.forBlock['logic_compare'] = function(block) {
    const OPS = { EQ:'==', NEQ:'!=', LT:'<', LTE:'<=', GT:'>', GTE:'>=' };
    const op = OPS[block.getFieldValue('OP')];
    const a  = Blockly.C.valueToCode(block, 'A', Blockly.C.ORDER_RELATIONAL) || '0';
    const b  = Blockly.C.valueToCode(block, 'B', Blockly.C.ORDER_RELATIONAL) || '0';
    return [`${a} ${op} ${b}`, Blockly.C.ORDER_RELATIONAL];
};

Blockly.C.forBlock['logic_operation'] = function(block) {
    const and   = block.getFieldValue('OP') === 'AND';
    const op    = and ? '&&' : '||';
    const order = and ? Blockly.C.ORDER_LOGICAL_AND : Blockly.C.ORDER_LOGICAL_OR;
    const a     = Blockly.C.valueToCode(block, 'A', order) || 'false';
    const b     = Blockly.C.valueToCode(block, 'B', order) || 'false';
    return [`${a} ${op} ${b}`, order];
};

Blockly.C.forBlock['logic_boolean'] = function(block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['logic_negate'] = function(block) {
    const arg = Blockly.C.valueToCode(block, 'BOOL', Blockly.C.ORDER_UNARY_PREFIX) || 'false';
    return [`!${arg}`, Blockly.C.ORDER_UNARY_PREFIX];
};

// ── 반복문 ────────────────────────────────────────────────────────────────
Blockly.C.forBlock['controls_whileUntil'] = function(block) {
    const until  = block.getFieldValue('MODE') === 'UNTIL';
    let   cond   = Blockly.C.valueToCode(block, 'BOOL', Blockly.C.ORDER_NONE) || 'false';
    const branch = Blockly.C.statementToCode(block, 'DO');
    if (until) cond = `!(${cond})`;
    return `while (${cond}) {\n${branch}}\n`;
};

Blockly.C.forBlock['controls_repeat_ext'] = function(block) {
    const times  = Blockly.C.valueToCode(block, 'TIMES', Blockly.C.ORDER_NONE) || '0';
    const v      = Blockly.C._getLoopVar();
    const branch = Blockly.C.statementToCode(block, 'DO');
    return `for (int ${v} = 0; ${v} < (int)(${times}); ${v}++) {\n${branch}}\n`;
};

// ── 공통 블록 ─────────────────────────────────────────────

Blockly.C.forBlock['ard_start'] = function(block) { return '\n'; };

// ── 함수(프로시저) ───────────────────────────────────────────────────────────
Blockly.C.forBlock['procedures_defreturn'] = function(block) {
    const funcName = Blockly.C.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
    let branch = Blockly.C.statementToCode(block, 'STACK');
    let returnValue = '';
    if (block.getInput('RETURN')) {
        returnValue = Blockly.C.valueToCode(block, 'RETURN', Blockly.C.ORDER_NONE) || '';
    }
    if (returnValue) {
        returnValue = Blockly.C.INDENT + 'return ' + returnValue + ';\n';
    }
    const returnType = returnValue ? 'float' : 'void';
    const args = [];
    const variables = block.getVars();
    for (let i = 0; i < variables.length; i++) {
        args.push('float ' + Blockly.C.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME));
    }
    let code = returnType + ' ' + funcName + '(' + args.join(', ') + ') {\n' +
        branch + returnValue + '}';
    code = Blockly.C.scrub_(block, code);
    Blockly.C.definitions_['%' + funcName] = code;
    return null;
};

Blockly.C.forBlock['procedures_defnoreturn'] = Blockly.C.forBlock['procedures_defreturn'];

Blockly.C.forBlock['procedures_callreturn'] = function(block) {
    const funcName = Blockly.C.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
    const args = [];
    const variables = block.getVars();
    for (let i = 0; i < variables.length; i++) {
        args[i] = Blockly.C.valueToCode(block, 'ARG' + i, Blockly.C.ORDER_NONE) || '0';
    }
    const code = funcName + '(' + args.join(', ') + ')';
    return [code, Blockly.C.ORDER_ATOMIC];
};

Blockly.C.forBlock['procedures_callnoreturn'] = function(block) {
    const funcName = Blockly.C.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
    const args = [];
    const variables = block.getVars();
    for (let i = 0; i < variables.length; i++) {
        args[i] = Blockly.C.valueToCode(block, 'ARG' + i, Blockly.C.ORDER_NONE) || '0';
    }
    const code = funcName + '(' + args.join(', ') + ');\n';
    return code;
};

Blockly.C.forBlock['procedures_ifreturn'] = function(block) {
    const condition = Blockly.C.valueToCode(block, 'CONDITION', Blockly.C.ORDER_NONE) || 'false';
    let code = 'if (' + condition + ') {\n';
    if (block.hasReturnValue_) {
        const value = Blockly.C.valueToCode(block, 'VALUE', Blockly.C.ORDER_NONE) || '0';
        code += Blockly.C.INDENT + 'return ' + value + ';\n';
    } else {
        code += Blockly.C.INDENT + 'return;\n';
    }
    code += '}\n';
    return code;
};

Blockly.C.forBlock['ard_delay'] = function(block) {
    const sec = Blockly.C.valueToCode(block, 'SEC', Blockly.C.ORDER_ATOMIC) || '1';
    return `  delay((int)((${sec})*1000));\n`;
};
Blockly.C.forBlock['ard_forever'] = function(block) {
    const branch = Blockly.C.statementToCode(block, 'DO');
    return `while (true) {\n${branch}}\n`;
};

