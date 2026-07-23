/**
 * handino.js
 * 핸드이노(Handino) 키트 정의
 * 5개의 180도 서보모터로 구성된 로봇 손 키트
 */
(function() {
    // SVG 아이콘 헬퍼
    function createSvgDataUri(svgContent) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">${svgContent}</svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // 서보 관련 핀 매핑 (블록코딩 및 펌웨어용)
    const SERVO_NAMES = {
        'thumb': { label: '엄지', pin: 12 },
        'index': { label: '검지', pin: 10 },
        'middle': { label: '중지', pin: 9 },
        'ring': { label: '약지', pin: 6 },
        'pinky': { label: '소지', pin: 2 }
    };

    window.KitRegistry.register('handino', {
        name: '핸드이노',
        icon: '🤖',
        color: '#8b5cf6',         // 보라색 계열
        headerColorClass: 'bg-violet-50 dark:bg-slate-800',

        // 센서: 핸드이노에는 센서가 없음
        sensors: [],

        // 액추에이터: 1개의 통합 컨트롤러
        actuators: [
            {
                id: 'robot-hand',
                type: 'custom',
                label: '🤖 로봇 손 (Robot Hand Controller)',
                controls: []
            }
        ],

        // 핀 설정
        pinConfig: {
            groups: [
                {
                    label: '서보모터 핀 (Servo Motors)',
                    pins: [
                        { id: 'servoThumb', label: '엄지', type: 'number', default: '12' },
                        { id: 'servoIndex', label: '검지', type: 'number', default: '10' },
                        { id: 'servoMiddle', label: '중지', type: 'number', default: '9' },
                        { id: 'servoRing', label: '약지', type: 'number', default: '6' },
                        { id: 'servoPinky', label: '소지', type: 'number', default: '2' }
                    ]
                }
            ]
        },

        firmware: 'handino',

        onConnect: function(hw) {
            hw.setAllServos(165);
        },

        // Blockly 블록 정의
        blockDefs: [
            // 개별 서보 각도 설정
            {
                "type": "hd_servo_set",
                "message0": "🤖 %1 서보를 %2 도로 설정",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "FINGER",
                        "options": [
                            ["엄지", "thumb"],
                            ["검지", "index"],
                            ["중지", "middle"],
                            ["약지", "ring"],
                            ["소지", "pinky"]
                        ]
                    },
                    { "type": "input_value", "name": "ANGLE", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#8b5cf6",
                "tooltip": "선택한 손가락의 서보모터를 지정한 각도(0~180)로 설정합니다.",
                "helpUrl": ""
            },
            // 모든 서보 한번에 설정
            {
                "type": "hd_servo_all",
                "message0": "🖐️ 모든 손가락을 %1 도로 설정",
                "args0": [
                    { "type": "input_value", "name": "ANGLE", "check": "Number" }
                ],
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#8b5cf6",
                "tooltip": "모든 서보모터를 같은 각도로 설정합니다.",
                "helpUrl": ""
            },
            // 주먹 쥐기
            {
                "type": "hd_fist",
                "message0": "✊ 주먹 쥐기",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#7c3aed",
                "tooltip": "모든 손가락을 접습니다 (주먹).",
                "helpUrl": ""
            },
            // 손 펴기
            {
                "type": "hd_open",
                "message0": "🖐️ 손 펴기",
                "previousStatement": null,
                "nextStatement": null,
                "colour": "#7c3aed",
                "tooltip": "모든 손가락을 펼칩니다.",
                "helpUrl": ""
            },
            // 서보 각도 읽기
            {
                "type": "hd_servo_get",
                "message0": "🤖 %1 서보 각도 읽기",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "FINGER",
                        "options": [
                            ["엄지", "thumb"],
                            ["검지", "index"],
                            ["중지", "middle"],
                            ["약지", "ring"],
                            ["소지", "pinky"]
                        ]
                    }
                ],
                "output": "Number",
                "colour": "#a78bfa",
                "tooltip": "선택한 손가락의 현재 서보 각도를 읽어옵니다.",
                "helpUrl": ""
            }
        ],

        // JS 코드 생성기
        jsGenerators: {
            'hd_servo_set': function(block, jsGen) {
                const finger = block.getFieldValue('FINGER');
                const angle = jsGen.valueToCode(block, 'ANGLE', jsGen.ORDER_ATOMIC) || '90';
                return `window.ArduinoHW.setServo('${finger}', ${angle});\n`;
            },
            'hd_servo_all': function(block, jsGen) {
                const angle = jsGen.valueToCode(block, 'ANGLE', jsGen.ORDER_ATOMIC) || '90';
                return `window.ArduinoHW.setAllServos(${angle});\n`;
            },
            'hd_fist': function(block, jsGen) {
                return `window.ArduinoHW.setAllServos(0);\n`;
            },
            'hd_open': function(block, jsGen) {
                return `window.ArduinoHW.setAllServos(180);\n`;
            },
            'hd_servo_get': function(block, jsGen) {
                const finger = block.getFieldValue('FINGER');
                return [`window.ArduinoHW.getServoAngle('${finger}')`, jsGen.ORDER_ATOMIC];
            }
        },

        // C 코드 생성기
        cGenerators: {
            'hd_servo_set': function(block, cGen) {
                const finger = block.getFieldValue('FINGER');
                const angle = cGen.valueToCode(block, 'ANGLE', cGen.ORDER_ATOMIC) || '90';
                const pinMap = { thumb: 2, index: 6, middle: 9, ring: 10, pinky: 12 };
                // 핀 설정에서 읽어올 수도 있지만, 기본값 사용
                function _getHandinoPins() {
                    const defaults = { servoThumb: '2', servoIndex: '6', servoMiddle: '9', servoRing: '10', servoPinky: '12' };
                    try {
                        const saved = localStorage.getItem('arduino_pins_handino');
                        if (saved) return Object.assign(defaults, JSON.parse(saved));
                    } catch(e) {}
                    return defaults;
                }
                const pins = _getHandinoPins();
                const pinKey = 'servo' + finger.charAt(0).toUpperCase() + finger.slice(1);
                const pin = pins[pinKey] || pinMap[finger];
                return `  servo_${finger}.write(${angle});\n`;
            },
            'hd_servo_all': function(block, cGen) {
                const angle = cGen.valueToCode(block, 'ANGLE', cGen.ORDER_ATOMIC) || '90';
                return `  servo_thumb.write(${angle});\n  servo_index.write(${angle});\n  servo_middle.write(${angle});\n  servo_ring.write(${angle});\n  servo_pinky.write(${angle});\n`;
            },
            'hd_fist': function(block, cGen) {
                return `  servo_thumb.write(0);\n  servo_index.write(0);\n  servo_middle.write(0);\n  servo_ring.write(0);\n  servo_pinky.write(0);\n`;
            },
            'hd_open': function(block, cGen) {
                return `  servo_thumb.write(180);\n  servo_index.write(180);\n  servo_middle.write(180);\n  servo_ring.write(180);\n  servo_pinky.write(180);\n`;
            },
            'hd_servo_get': function(block, cGen) {
                const finger = block.getFieldValue('FINGER');
                return [`servo_${finger}.read()`, cGen.ORDER_ATOMIC];
            }
        },

        // Blockly toolbox 카테고리
        toolboxCategories: [
            `<category name="핸드이노 제어" colour="#8b5cf6">
                <block type="hd_servo_set">
                    <value name="ANGLE"><shadow type="math_number"><field name="NUM">90</field></shadow></value>
                </block>
                <block type="hd_servo_all">
                    <value name="ANGLE"><shadow type="math_number"><field name="NUM">90</field></shadow></value>
                </block>
                <block type="hd_fist"></block>
                <block type="hd_open"></block>
                <block type="hd_servo_get"></block>
            </category>`
        ],

        // 카테고리 아이콘
        categoryIcons: {
            '핸드이노 제어': createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#8b5cf6" opacity="0.18"/><text x="24" y="33" text-anchor="middle" font-size="28">🤖</text>`)
        },

        // 데이터 파싱 (핸드이노는 센서가 없으므로 기본 처리)
        parseData: function(data, sensorValues) {
            // 핸드이노는 센서 데이터가 없으므로 false 반환
            return false;
        },

        // 연결 시 초기화
        onConnect: function(hw) {
            // 모든 서보를 90도(중립)로 초기화
            setTimeout(() => {
                ['thumb', 'index', 'middle', 'ring', 'pinky'].forEach(finger => {
                    hw.setServo(finger, 90);
                });
            }, 100);
        },

        // 액추에이터 이벤트 바인딩
        bindActuatorEvents: function({ hw, serial, isConnected, kitId }) {
            // 각 서보 슬라이더 이벤트
            const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];
            fingers.forEach(finger => {
                const slider = document.getElementById(`servo-${finger}-angle`);
                const valDisplay = document.getElementById(`servo-${finger}-angle-val`);
                if (slider) {
                    slider.addEventListener('input', (e) => {
                        if (valDisplay) valDisplay.textContent = e.target.value + '°';
                        if (window.isBlocklyRunning) return;
                        if (isConnected()) {
                            hw.setServo(finger, parseInt(e.target.value, 10));
                        }
                    });
                }
            });
        },

        // 추가 UI 렌더링 (인터랙티브 로봇 손)
        renderActuatorExtras: function(container, actuatorId) {
            if (actuatorId !== 'robot-hand') return;

            function createFingerSvg(id, x, y, angle, width, height) {
                return `
                <g transform="translate(${x}, ${y}) rotate(${angle})">
                    <circle cx="0" cy="0" r="${width/2 - 1}" fill="#fed7aa" />
                    <g id="svg-finger-${id}" style="transform-origin: center bottom; transform-box: fill-box; transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); transform: scaleY(0.65);">
                        <path d="M ${-width/2} 0 L ${-width/2} ${-height+width/2} A ${width/2} ${width/2} 0 0 1 ${width/2} ${-height+width/2} L ${width/2} 0" fill="#fed7aa" stroke="#fdba74" stroke-width="2" />
                        <!-- 손가락 관절 주름 -->
                        <path d="M ${-width*0.35} ${-height*0.45} Q 0 ${-height*0.45 + 4} ${width*0.35} ${-height*0.45}" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" />
                        <path d="M ${-width*0.35} ${-height*0.45 - 5} Q 0 ${-height*0.45 - 1} ${width*0.35} ${-height*0.45 - 5}" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" />
                        <path d="M ${-width*0.3} ${-height*0.8} Q 0 ${-height*0.8 + 3} ${width*0.3} ${-height*0.8}" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" />
                    </g>
                </g>
                `;
            }

            const svgHtml = `
            <svg viewBox="0 0 240 280" class="w-full h-auto max-w-[220px] drop-shadow-2xl mx-auto" style="perspective: 800px;">
                <!-- 손목 -->
                <path d="M 85 220 L 155 220 L 165 280 L 75 280 Z" fill="#fed7aa" stroke="#fdba74" stroke-width="2" />
                <path d="M 100 240 Q 120 245 140 240" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" />
                <path d="M 100 260 Q 120 265 140 260" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" />
                
                <!-- 손바닥 -->
                <path d="M 70 230 C 40 180, 50 120, 75 110 L 175 110 C 190 120, 210 180, 180 230 C 150 245, 100 245, 70 230 Z" fill="#fed7aa" stroke="#fdba74" stroke-width="3"/>
                
                <!-- 손금 디테일 -->
                <path d="M 70 140 C 100 160, 130 180, 170 160" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
                <path d="M 80 170 C 110 190, 140 210, 150 220" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
                <path d="M 120 120 C 130 140, 150 150, 180 130" fill="none" stroke="#fdba74" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
                
                <!-- 손가락들 (자연스럽게 배치) -->
                ${createFingerSvg('thumb', 55, 140, -45, 26, 60)}
                ${createFingerSvg('index', 75, 110, -10, 24, 75)}
                ${createFingerSvg('middle', 110, 105, 0, 26, 85)}
                ${createFingerSvg('ring', 145, 110, 10, 24, 75)}
                ${createFingerSvg('pinky', 175, 120, 25, 22, 60)}
            </svg>
            `;

            const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];
            
            const extraDiv = document.createElement('div');
            extraDiv.className = 'w-full flex flex-col lg:flex-row gap-6 p-2';
            extraDiv.innerHTML = `
                <!-- 좌측 뷰어 -->
                <div class="lg:w-5/12 flex items-center justify-center bg-slate-800 dark:bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-inner">
                    ${svgHtml}
                </div>
                
                <!-- 우측 제어부 -->
                <div class="lg:w-7/12 flex flex-col gap-4">
                    <div class="flex gap-2">
                        <button id="btn-hand-open" class="flex-1 bg-violet-500 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-violet-600 transition shadow-md flex items-center justify-center gap-2">
                            <span>🖐️</span> 전체 펴기
                        </button>
                        <button id="btn-hand-fist" class="flex-1 bg-slate-600 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-slate-700 transition shadow-md flex items-center justify-center gap-2">
                            <span>✊</span> 전체 쥐기
                        </button>
                    </div>

                    <div class="bg-gray-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-5">
                        <!-- 전체 각도 슬라이더 -->
                        <div>
                            <label class="text-sm font-bold text-gray-800 dark:text-gray-200 flex justify-between mb-2">
                                <span>🔄 전체 각도 일괄 조절</span>
                                <span id="servo-all-angle-val" class="text-violet-600 dark:text-violet-400">165°</span>
                            </label>
                            <input type="range" id="servo-all-angle" min="15" max="165" step="1" value="165" class="w-full accent-violet-500 h-2 cursor-pointer">
                        </div>
                        
                        <hr class="border-gray-200 dark:border-slate-600">

                        <!-- 개별 슬라이더들 -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            ${fingers.map(finger => {
                                const minAngle = finger === 'thumb' ? 30 : 15;
                                return `
                                <div>
                                    <label class="text-xs font-bold text-gray-600 dark:text-gray-400 flex justify-between mb-1.5">
                                        <span>${SERVO_NAMES[finger].label}</span>
                                        <span id="servo-${finger}-angle-val">165°</span>
                                    </label>
                                    <input type="range" id="servo-${finger}-angle" min="${minAngle}" max="165" step="1" value="165" class="w-full accent-violet-400 h-1.5 cursor-pointer" data-finger="${finger}">
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(extraDiv);
        },

        bindActuatorEvents: function(ctx) {
            const hw = ctx.hw || window.ArduinoHW;
            const isConnectedFn = ctx.isConnected;
            const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];
            
            function updateFingerVisual(finger, angle) {
                const el = document.getElementById('svg-finger-' + finger);
                if (el) {
                    const minAngle = finger === 'thumb' ? 30 : 15;
                    const maxAngle = 165;
                    // 165도일때 1 (완전히 펴짐), 최소각도일때 -1 (손바닥 쪽으로 완전히 꺾임)
                    const ratio = (angle - minAngle) / (maxAngle - minAngle);
                    const scaleY = -1 + ratio * 2;
                    el.style.transform = `scaleY(${scaleY})`;
                }
            }

            const btnOpen = document.getElementById('btn-hand-open');
            const btnFist = document.getElementById('btn-hand-fist');
            const allSlider = document.getElementById('servo-all-angle');
            const allVal = document.getElementById('servo-all-angle-val');

            if (btnOpen) {
                btnOpen.addEventListener('click', () => {
                    if (window.isBlocklyRunning) return alert('블록 코딩이 실행 중입니다.');
                    if (hw && isConnectedFn && isConnectedFn()) hw.setAllServos(165);
                    fingers.forEach(f => {
                        const s = document.getElementById(`servo-${f}-angle`);
                        const v = document.getElementById(`servo-${f}-angle-val`);
                        if (s) s.value = 165;
                        if (v) v.textContent = '165°';
                        updateFingerVisual(f, 165);
                    });
                    if (allSlider) allSlider.value = 165;
                    if (allVal) allVal.textContent = '165°';
                });
            }

            if (btnFist) {
                btnFist.addEventListener('click', () => {
                    if (window.isBlocklyRunning) return alert('블록 코딩이 실행 중입니다.');
                    // Firmware will constrain "0" to the correct minimums! 
                    if (hw && isConnectedFn && isConnectedFn()) hw.setAllServos(0); 
                    fingers.forEach(f => {
                        const minAngle = f === 'thumb' ? 30 : 15;
                        const s = document.getElementById(`servo-${f}-angle`);
                        const v = document.getElementById(`servo-${f}-angle-val`);
                        if (s) s.value = minAngle;
                        if (v) v.textContent = minAngle + '°';
                        updateFingerVisual(f, minAngle);
                    });
                    if (allSlider) allSlider.value = 15;
                    if (allVal) allVal.textContent = '15°';
                });
            }

            if (allSlider) {
                allSlider.addEventListener('input', (e) => {
                    const angle = parseInt(e.target.value, 10);
                    if (allVal) allVal.textContent = angle + '°';
                    if (!window.isBlocklyRunning && hw && isConnectedFn && isConnectedFn()) hw.setAllServos(angle);
                    
                    fingers.forEach(f => {
                        const minAngle = f === 'thumb' ? 30 : 15;
                        const validAngle = Math.max(angle, minAngle);
                        
                        const s = document.getElementById(`servo-${f}-angle`);
                        const v = document.getElementById(`servo-${f}-angle-val`);
                        if (s) s.value = validAngle;
                        if (v) v.textContent = validAngle + '°';
                        updateFingerVisual(f, validAngle);
                    });
                });
            }

            fingers.forEach(finger => {
                const slider = document.getElementById(`servo-${finger}-angle`);
                if (slider) {
                    slider.addEventListener('input', (e) => {
                        const angle = parseInt(e.target.value, 10);
                        const v = document.getElementById(`servo-${finger}-angle-val`);
                        if (v) v.textContent = angle + '°';
                        
                        updateFingerVisual(finger, angle);

                        if (!window.isBlocklyRunning && hw && isConnectedFn && isConnectedFn()) {
                            if (hw.setServo) hw.setServo(finger, angle);
                        }
                    });
                }
            });
        }
    });
})();
