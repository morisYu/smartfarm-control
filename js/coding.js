/**
 * coding.js
 * 블록 코딩 페이지의 UI 로직 및 코드 실행을 담당합니다.
 */

// --- 1. Blockly Toolbox (도구상자) 정의 ---
const toolbox = `
<xml id="toolbox" style="display: none">
    <category name="이벤트" colour="#FFBF00">
        <block type="sf_start"></block>
    </category>
    <category name="논리" categorystyle="logic_category">
        <block type="controls_if"></block>
        <block type="logic_compare"></block>
        <block type="logic_operation"></block>
        <block type="logic_negate"></block>
        <block type="logic_boolean"></block>
    </category>
    <category name="반복" categorystyle="loop_category">
        <block type="sf_forever"></block>
        <block type="controls_repeat_ext">
            <value name="TIMES">
                <shadow type="math_number"><field name="NUM">10</field></shadow>
            </value>
        </block>
        <block type="controls_whileUntil"></block>
    </category>
    <category name="수학" categorystyle="math_category">
        <block type="math_number"></block>
        <block type="math_arithmetic">
            <value name="A"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
            <value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        </block>
        <block type="math_single">
            <value name="NUM"><shadow type="math_number"><field name="NUM">9</field></shadow></value>
        </block>
        <block type="math_trig">
            <value name="NUM"><shadow type="math_number"><field name="NUM">45</field></shadow></value>
        </block>
        <block type="math_constant"></block>
        <block type="math_number_property">
            <value name="NUMBER_TO_CHECK"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
        </block>
        <block type="math_round">
            <value name="NUM"><shadow type="math_number"><field name="NUM">3.1</field></shadow></value>
        </block>
        <block type="math_on_list"></block>
        <block type="math_modulo">
            <value name="DIVIDEND"><shadow type="math_number"><field name="NUM">64</field></shadow></value>
            <value name="DIVISOR"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
        </block>
        <block type="math_constrain">
            <value name="VALUE"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
            <value name="LOW"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
            <value name="HIGH"><shadow type="math_number"><field name="NUM">100</field></shadow></value>
        </block>
        <block type="math_random_int">
            <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
            <value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value>
        </block>
        <block type="math_random_float"></block>
    </category>
    <category name="문자열" categorystyle="text_category">
        <block type="text"></block>
        <block type="text_join"></block>
        <block type="text_append">
            <value name="TEXT"><shadow type="text"></shadow></value>
        </block>
        <block type="text_length">
            <value name="VALUE"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_isEmpty">
            <value name="VALUE"><shadow type="text"><field name="TEXT"></field></shadow></value>
        </block>
        <block type="text_indexOf">
            <value name="VALUE"><block type="variables_get"><field name="VAR">text</field></block></value>
            <value name="FIND"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_charAt">
            <value name="VALUE"><block type="variables_get"><field name="VAR">text</field></block></value>
        </block>
        <block type="text_getSubstring">
            <value name="STRING"><block type="variables_get"><field name="VAR">text</field></block></value>
        </block>
        <block type="text_changeCase">
            <value name="TEXT"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
        <block type="text_trim">
            <value name="TEXT"><shadow type="text"><field name="TEXT">abc</field></shadow></value>
        </block>
    </category>
    <category name="리스트" categorystyle="list_category">
        <block type="lists_create_with">
            <mutation items="0"></mutation>
        </block>
        <block type="lists_create_with"></block>
        <block type="lists_repeat">
            <value name="NUM"><shadow type="math_number"><field name="NUM">5</field></shadow></value>
        </block>
        <block type="lists_length"></block>
        <block type="lists_isEmpty"></block>
        <block type="lists_indexOf">
            <value name="VALUE"><block type="variables_get"><field name="VAR">list</field></block></value>
        </block>
        <block type="lists_getIndex">
            <value name="VALUE"><block type="variables_get"><field name="VAR">list</field></block></value>
        </block>
        <block type="lists_setIndex">
            <value name="LIST"><block type="variables_get"><field name="VAR">list</field></block></value>
        </block>
        <block type="lists_getSublist">
            <value name="LIST"><block type="variables_get"><field name="VAR">list</field></block></value>
        </block>
        <block type="lists_split">
            <value name="DELIM"><shadow type="text"><field name="TEXT">,</field></shadow></value>
        </block>
        <block type="lists_sort"></block>
    </category>
    <category name="변수" categorystyle="variable_category" custom="VARIABLE"></category>
    <category name="함수" categorystyle="procedure_category" custom="PROCEDURE"></category>
    <category name="스마트팜 센서" colour="#4CBFE6">
        <block type="sf_get_temp"></block>
        <block type="sf_get_humid"></block>
        <block type="sf_get_light"></block>
        <block type="sf_get_soil"></block>
    </category>
    <category name="스마트팜 제어" colour="#FF6680">
        <block type="sf_pump_on">
            <value name="SPEED"><shadow type="math_number"><field name="NUM">200</field></shadow></value>
        </block>
        <block type="sf_pump_off"></block>
        <block type="sf_rgb_set">
            <value name="R"><shadow type="math_number"><field name="NUM">255</field></shadow></value>
            <value name="G"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
            <value name="B"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
        </block>
        <block type="sf_rgb_off"></block>
        <block type="sf_buzzer_on">
            <value name="FREQ"><shadow type="math_number"><field name="NUM">1000</field></shadow></value>
        </block>
        <block type="sf_buzzer_off"></block>
        <block type="sf_delay">
            <value name="SEC"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        </block>
    </category>
</xml>
`;

// --- 2. 초기화 및 이벤트 리스너 ---
let workspace;
let isRunning = false;
let executionAbortController = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // 탭 전환 로직
    const tabDashboard = document.getElementById('tab-dashboard');
    const tabCoding = document.getElementById('tab-coding');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewCoding = document.getElementById('view-coding');
    
    tabDashboard.addEventListener('click', () => {
        // 스타일 토글
        tabDashboard.classList.replace('bg-transparent', 'bg-white/20');
        tabDashboard.classList.replace('text-emerald-100', 'text-white');
        
        tabCoding.classList.replace('bg-white/20', 'bg-transparent');
        tabCoding.classList.replace('text-white', 'text-emerald-100');
        
        // 뷰 토글
        viewDashboard.classList.remove('hidden');
        viewCoding.classList.add('hidden');
    });

    tabCoding.addEventListener('click', () => {
        tabCoding.classList.replace('bg-transparent', 'bg-white/20');
        tabCoding.classList.replace('text-emerald-100', 'text-white');
        
        tabDashboard.classList.replace('bg-white/20', 'bg-transparent');
        tabDashboard.classList.replace('text-white', 'text-emerald-100');
        
        viewDashboard.classList.add('hidden');
        viewCoding.classList.remove('hidden');
        
        // Blockly 창 리사이즈 (숨겨져 있다가 나타날 때 크기 재계산 필요)
        if (workspace) {
            Blockly.svgResize(workspace);
        }
    });

    // --- Blockly 기본 문구(우클릭 메뉴) 커스터마이징 ---
    if (Blockly.Msg) {
        Blockly.Msg['DUPLICATE_BLOCK'] = '복제';
        Blockly.Msg['DELETE_BLOCK'] = '블록 삭제';
        Blockly.Msg['DELETE_X_BLOCKS'] = '블록 삭제';
    }

    // "복제" 시 하위 블록(연결된 다음 블록들)까지 모두 포함하도록 기본 동작 덮어쓰기
    const duplicateItem = Blockly.ContextMenuRegistry.registry.getItem('blockDuplicate');
    if (duplicateItem) {
        duplicateItem.callback = function(scope) {
            if (scope.block) {
                // 직렬화 옵션을 통해 하위 블록(next)까지 포함하여 저장
                const state = Blockly.serialization.blocks.save(scope.block, {
                    addCoordinates: true,
                    addNextBlocks: true // 핵심: 하위 블록까지 복제
                });
                
                // 위치 이동 (기존 복제 동작과 유사하게 살짝 우측 하단으로)
                if (state.y !== undefined && state.x !== undefined) {
                    state.x += 40;
                    state.y += 40;
                } else {
                    // 자식 블록을 우클릭해서 복제하는 경우 좌표가 누락될 수 있으므로 절대 좌표 계산
                    const coords = scope.block.getRelativeToSurfaceXY();
                    state.x = coords.x + 40;
                    state.y = coords.y + 40;
                }
                
                // 실행 취소(Undo) 시 한 번에 취소되도록 그룹화
                Blockly.Events.setGroup(true);
                const newBlock = Blockly.serialization.blocks.append(state, scope.block.workspace);
                newBlock.select();
                Blockly.Events.setGroup(false);
            }
        };
    }

    // Blockly 주입 (Injection) - 렌더러는 기본으로 두어 크기를 줄이고, 테마는 Zelos로 설정해 밝은 색상 유지
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: toolbox,
        theme: Blockly.Themes ? Blockly.Themes.Zelos : undefined,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        trashcan: true,
        scrollbars: true
    });

    // --- 자동 저장 & 복구 시스템 ---
    const STORAGE_KEY = 'smartfarm_block_backup';
    const indicator = document.getElementById('auto-save-indicator');
    let saveTimeout = null;

    // 1. 초기 로드 (자동 복구)
    const savedBlocks = localStorage.getItem(STORAGE_KEY);
    if (savedBlocks) {
        try {
            const json = JSON.parse(savedBlocks);
            Blockly.serialization.workspaces.load(json, workspace);
        } catch (e) {
            console.error("저장된 블록을 불러오는데 실패했습니다.", e);
        }
    }

    // 실시간 코드 변환 이벤트 연결 및 디바운싱 자동 저장
    workspace.addChangeListener((e) => {
        // 기존 아두이노 코드 변환 업데이트
        updateCodePreview(e);

        // UI 이벤트(선택, 클릭 등)는 저장 감지에서 제외
        if (e.isUiEvent) return;

        // 상태 표시: 저장 중...
        if (indicator) {
            indicator.textContent = '저장 중...';
            indicator.classList.remove('opacity-0');
            indicator.classList.replace('text-gray-500', 'text-amber-500');
            indicator.classList.replace('dark:text-gray-300', 'dark:text-amber-400');
        }

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            try {
                const state = Blockly.serialization.workspaces.save(workspace);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                
                // 상태 표시: 저장 완료
                if (indicator) {
                    indicator.textContent = '✔️ 자동 저장됨';
                    indicator.classList.replace('text-amber-500', 'text-gray-500');
                    indicator.classList.replace('dark:text-amber-400', 'dark:text-gray-300');
                    
                    // 3초 후 인디케이터 서서히 숨김
                    setTimeout(() => {
                        indicator.classList.add('opacity-0');
                    }, 3000);
                }
            } catch (err) {
                console.error("자동 저장 실패:", err);
            }
        }, 1500); // 1.5초 디바운싱
    });
    
    // 초기 렌더링을 위해 수동 호출
    updateCodePreview({type: 'init'});

    // --- 브라우저 이탈 방지 안전장치 ---
    window.addEventListener('beforeunload', (event) => {
        // 워크스페이스에 사용자 블록이 1개라도 존재하는 경우
        if (workspace.getAllBlocks(false).length > 0) {
            event.preventDefault();
            event.returnValue = ''; // 표준 방식: 시스템 확인 팝업 발생
        }
    });

    // [버그 픽스] 플라이아웃이 숨겨질 때 남아있는 스크롤바 강제 숨김
    setInterval(() => {
        const flyout = document.querySelector('.blocklyFlyout');
        let scrollbars = document.querySelectorAll('.blocklyFlyoutScrollbar');
        if (scrollbars.length === 0) {
            const allVerticals = document.querySelectorAll('.blocklyScrollbarVertical');
            if (allVerticals.length > 1) {
                // 첫번째는 메인 워크스페이스, 두번째(마지막)가 플라이아웃 스크롤바
                scrollbars = [allVerticals[allVerticals.length - 1]];
            }
        }
        if (flyout && scrollbars.length > 0) {
            const isHidden = window.getComputedStyle(flyout).display === 'none';
            scrollbars.forEach(sb => { sb.style.display = isHidden ? 'none' : ''; });
        }
    }, 100);

    // --- 커스텀 Blockly 프롬프트 모달 (변수/함수 이름 입력) ---
    Blockly.dialog.setPrompt(function(message, defaultValue, callback) {
        const modal = document.getElementById('blockly-prompt-modal');
        const messageEl = document.getElementById('blockly-prompt-message');
        const inputEl = document.getElementById('blockly-prompt-input');
        const btnOk = document.getElementById('btn-prompt-ok');
        const btnCancel = document.getElementById('btn-prompt-cancel');

        // 모달 텍스트 및 기본값 설정
        // Blockly가 보내는 메시지(예: "새 변수 이름:")에서 불필요한 부분 다듬기
        messageEl.textContent = message.replace(':', '');
        inputEl.value = defaultValue;
        
        // 모달 표시
        modal.classList.remove('hidden');
        inputEl.focus();
        inputEl.select();

        // 이벤트 리스너 정리 함수
        const cleanup = () => {
            modal.classList.add('hidden');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            inputEl.removeEventListener('keydown', onKeydown);
        };

        // 확인 액션
        const onOk = () => {
            cleanup();
            callback(inputEl.value);
        };

        // 취소 액션
        const onCancel = () => {
            cleanup();
            callback(null);
        };

        // 키보드 지원 (엔터/ESC)
        const onKeydown = (e) => {
            if (e.key === 'Enter') onOk();
            if (e.key === 'Escape') onCancel();
        };

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        inputEl.addEventListener('keydown', onKeydown);
    });

    // 실행 / 중지 버튼
    const btnRun = document.getElementById('btn-run-code');
    const btnStop = document.getElementById('btn-stop-code');

    btnRun.addEventListener('click', runCode);
    btnStop.addEventListener('click', stopCode);
});

// --- 3. 실시간 코드 업데이트 ---
function updateCodePreview(event) {
    if (event && event.type == Blockly.Events.UI) return; // UI 이벤트는 무시
    
    try {
        // 시작 블록 찾기 (전체 블록 중에서 검색)
        const startBlocks = workspace.getAllBlocks().filter(b => b.type === 'sf_start');
        
        let jsCode = '';
        let cCode = '';
        
        if (startBlocks.length > 0) {
            // 시작 블록이 있으면, 시작 블록에 연결된 코드만 생성
            Blockly.JavaScript.init(workspace);
            jsCode = Blockly.JavaScript.blockToCode(startBlocks[0]);
            
            Blockly.C.init(workspace);
            let innerCode = Blockly.C.blockToCode(startBlocks[0]) || '';
            
            cCode = `void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n${innerCode.trim() ? innerCode.split('\\n').map(line => '  ' + line).join('\\n') : '  // 코드를 조립하세요'}\n}\n`;
        } else {
            // 없으면 경고 메시지 출력
            jsCode = "// '▶ 시작하기' 블록을 먼저 추가해주세요.\\n";
            cCode = `void setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  // '▶ 시작하기' 블록을 먼저 추가해주세요.\n}\n`;
        }

        const jsPreview = document.getElementById('code-preview-js');
        if (jsPreview) jsPreview.textContent = jsCode;
        
        document.getElementById('code-preview-c').textContent = cCode;
    } catch (e) {
        console.error("코드 생성 오류:", e);
        document.getElementById('code-preview-c').textContent = "오류 발생: " + e.message;
    }
}

// --- 4. JS 코드 실행 (비동기 래핑) ---
async function runCode() {
    if (isRunning) return;
    
    const startBlocks = workspace.getAllBlocks().filter(b => b.type === 'sf_start');
    if (startBlocks.length === 0) {
        alert("작업 공간에 '▶ 시작하기' 블록이 없습니다. 먼저 추가해주세요!");
        return;
    }

    const jsCode = Blockly.JavaScript.blockToCode(startBlocks[0]);
    if (!jsCode || !jsCode.trim()) {
        alert("시작하기 블록에 연결된 로직이 없습니다.");
        return;
    }

    if (!window.SmartFarmHW) {
        alert("하드웨어 모듈(SmartFarmHW)을 찾을 수 없습니다.");
        return;
    }

    const btnRun = document.getElementById('btn-run-code');
    const btnStop = document.getElementById('btn-stop-code');
    
    isRunning = true;
    btnRun.classList.add('hidden');
    btnStop.classList.remove('hidden');

    // 비동기 실행 취소를 위한 전역 플래그
    window.__isBlocklyCancelled = false;
    
    // stopCode 함수가 안전하게 취소할 수 있도록 접근점 제공
    window.__cancelBlocklyRun = () => { window.__isBlocklyCancelled = true; };

    // 안전한 비동기 함수로 래핑
    // 사용자 코드에 delay(await)가 있으므로 AsyncFunction 생성자를 사용합니다.
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    
    try {
        // 무한 루프 등 방지를 위해 코드를 실행하지만, 근본적인 무한 루프 제어는 JS Generator 단에서 
        // yield나 abort 체크 로직을 넣는 것이 좋지만, 현재는 간단한 구현을 위해 순수 코드를 사용합니다.
        // 실행 도중 isCancelled를 주기적으로 체크할 수 있도록, 
        // Blockly 루프 제너레이터를 수정하지 않은 한 while(true)에 빠지면 브라우저가 멈출 수 있습니다.
        // 이 점을 주의하여, 딜레이 블록을 루프에 넣도록 안내해야 합니다.
        
        const executableCode = `
            try {
                ${jsCode}
            } catch(e) {
                console.error("블록 실행 중 오류:", e);
                alert("코드 실행 중 오류가 발생했습니다: " + e.message);
            }
        `;
        
        const func = new AsyncFunction(executableCode);
        await func();

    } catch(e) {
        console.error("비동기 함수 생성 오류:", e);
        alert("코드를 파싱하는 중 오류가 발생했습니다.");
    } finally {
        isRunning = false;
        btnRun.classList.remove('hidden');
        btnStop.classList.add('hidden');
        window.__isBlocklyCancelled = true;
        
        // 실행 종료 시 모든 액추에이터 끄기 (안전)
        window.SmartFarmHW.turnOffPump();
        window.SmartFarmHW.turnOffRgbLed();
        window.SmartFarmHW.turnOffBuzzer();
    }
}

function stopCode() {
    if (!isRunning) return;
    
    if (window.__cancelBlocklyRun) {
        window.__cancelBlocklyRun();
    }
    
    // 시리얼 전송 대기열을 완전히 비워 이전에 쌓인 명령을 취소 (인터럽트)
    if (window.SmartFarmSerial && window.SmartFarmSerial.clearQueue) {
        window.SmartFarmSerial.clearQueue();
    }
    
    // 현재 실행 중인 딜레이나 작업들을 강제 종료하기 위해 하드웨어를 즉시 멈춤
    window.SmartFarmHW.turnOffPump();
    window.SmartFarmHW.turnOffRgbLed();
    window.SmartFarmHW.turnOffBuzzer();
    
    isRunning = false;
    document.getElementById('btn-run-code').classList.remove('hidden');
    document.getElementById('btn-stop-code').classList.add('hidden');
}
