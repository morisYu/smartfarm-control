/**
 * app.js
 * 메인 애플리케이션 로직 (UI 이벤트 바인딩 및 데이터 파싱)
 */
// avrbro는 펌웨어 업로드 시에만 필요하므로 지연 로드
// (static import 시 CDN 접속 실패하면 전체 모듈이 로드되지 않는 문제 방지)
let avrbro = null;

// --- Web Serial Polyfill 초기화 (안드로이드/비호환 브라우저 지원) ---
const isAndroid = /Android/i.test(navigator.userAgent);
if (!navigator.serial || isAndroid) {
    if (navigator.usb) {
        try {
            const { serial: polyfillSerial } = await Promise.race([
                import('https://unpkg.com/web-serial-polyfill@1.0.15/dist/serial.js'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Polyfill 로드 타임아웃 (5초)')), 5000))
            ]);
            Object.defineProperty(navigator, 'serial', {
                value: polyfillSerial,
                writable: true,
                configurable: true
            });
            console.log("[App] Web Serial Polyfill (WebUSB) 적용 완료.");
        } catch (e) {
            console.error("[App] Web Serial Polyfill 로드 실패:", e);
        }
    } else {
        console.warn("[App] WebUSB 미지원. 안드로이드에서 시리얼을 사용하려면 HTTPS 또는 localhost로 접속하세요.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 전역 모듈 가져오기
    const serial = window.SmartFarmSerial;
    const hw = window.SmartFarmHW;

    // --- DOM 요소 참조 ---
    
    // 연결 관련
    const btnConnect = document.getElementById('btn-connect');
    const statusEl = document.getElementById('connection-status');
    const logEl = document.getElementById('serial-log');
    const btnClearLog = document.getElementById('btn-clear-log');

    // 센서 대시보드
    const valTemp = document.getElementById('val-temp');
    const valHumid = document.getElementById('val-humid');
    const valLight = document.getElementById('val-light');
    const valSoil = document.getElementById('val-soil');

    // 펌프(DC모터) 제어
    const btnPumpOn = document.getElementById('btn-pump-on');
    const btnPumpOff = document.getElementById('btn-pump-off');
    const statusPump = document.getElementById('status-pump');
    const pumpSpeed = document.getElementById('pump-speed');
    const pumpSpeedVal = document.getElementById('pump-speed-val');

    // RGB LED 제어
    const colorPicker = document.getElementById('color-picker');
    const btnColorApply = document.getElementById('btn-color-apply');
    const btnColorOff = document.getElementById('btn-color-off');

    // 부저 제어
    const btnBuzzerOn = document.getElementById('btn-buzzer-on');
    const btnBuzzerOff = document.getElementById('btn-buzzer-off');
    const statusBuzzer = document.getElementById('status-buzzer');
    const buzzerFreq = document.getElementById('buzzer-freq');
    const buzzerFreqVal = document.getElementById('buzzer-freq-val');
    const buzzerMelody = document.getElementById('buzzer-melody');
    const btnBuzzerPlay = document.getElementById('btn-buzzer-play');

    // 핀 설정 관련 UI
    const btnPinConfig = document.getElementById('btn-pin-config');
    const modalPinConfig = document.getElementById('pin-config-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSavePins = document.getElementById('btn-save-pins');

    // 펌웨어 업로드 관련 UI
    const btnInstallFw = document.getElementById('btn-install-fw');
    const modalFlash = document.getElementById('flash-modal');
    const flashProgressBar = document.getElementById('flash-progress-bar');
    const flashStatusText = document.getElementById('flash-status-text');
    const btnCloseFlash = document.getElementById('btn-close-flash');

    // 핀 입력 필드들
    const pinInputs = {
        dht: document.getElementById('pin-dht'),
        light: document.getElementById('pin-light'),
        soil: document.getElementById('pin-soil'),
        pumpDir: document.getElementById('pin-pump-dir'),
        pumpPwm: document.getElementById('pin-pump-pwm'),
        buzzer: document.getElementById('pin-buzzer'),
        rgbR: document.getElementById('pin-rgb-r'),
        rgbG: document.getElementById('pin-rgb-g'),
        rgbB: document.getElementById('pin-rgb-b'),
        rgbType: document.getElementById('pin-rgb-type'),
        pumpType: document.getElementById('pin-pump-type')
    };

    // 상태 변수
    let isConnected = false;

    // --- 다크 모드 토글 ---
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const isDarkMode = localStorage.getItem('smartfarm_theme') === 'dark';
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    }
    
    btnThemeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('smartfarm_theme', isDark ? 'dark' : 'light');
        updateChartTheme();
    });

    // --- Chart.js 초기화 ---
    const ctx = document.getElementById('sensorChart').getContext('2d');
    const sensorCards = document.querySelectorAll('.sensor-card');
    const chartTitle = document.getElementById('chart-title');
    
    const MAX_DATA_POINTS = 30;
    const sensorData = {
        temp: { label: '온도', data: [], color: '#3b82f6', borderColor: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
        humid: { label: '습도', data: [], color: '#06b6d4', borderColor: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' },
        light: { label: '조도', data: [], color: '#eab308', borderColor: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)' },
        soil: { label: '토양 수분', data: [], color: '#10b981', borderColor: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' }
    };
    
    let activeSensor = 'temp';
    let timeLabels = [];

    let sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: sensorData[activeSensor].label,
                data: sensorData[activeSensor].data,
                borderColor: sensorData[activeSensor].borderColor,
                backgroundColor: sensorData[activeSensor].bgColor,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { display: false },
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(156, 163, 175, 0.2)' },
                    ticks: { color: '#6b7280' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    function updateChartTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(156, 163, 175, 0.2)';
        const tickColor = isDark ? '#94a3b8' : '#6b7280';
        sensorChart.options.scales.y.grid.color = gridColor;
        sensorChart.options.scales.y.ticks.color = tickColor;
        sensorChart.update();
    }
    updateChartTheme();

    sensorCards.forEach(card => {
        card.addEventListener('click', () => {
            sensorCards.forEach(c => {
                c.classList.remove('active', 'shadow-md', c.dataset.activeBorder, c.dataset.activeDarkBorder);
                c.classList.add('border-transparent', 'shadow-sm');
            });
            card.classList.add('active', 'shadow-md', card.dataset.activeBorder, card.dataset.activeDarkBorder);
            card.classList.remove('border-transparent', 'shadow-sm');
            
            activeSensor = card.dataset.sensor;
            const sData = sensorData[activeSensor];
            sensorChart.data.datasets[0].label = sData.label;
            sensorChart.data.datasets[0].data = sData.data;
            sensorChart.data.datasets[0].borderColor = sData.borderColor;
            sensorChart.data.datasets[0].backgroundColor = sData.bgColor;
            
            chartTitle.innerHTML = `<div class="w-3 h-3 rounded-full" style="background-color:${sData.color}"></div> ${sData.label} 실시간 모니터링`;
            sensorChart.update();
        });
    });

    // --- 초기화: 저장된 핀 설정 로드 ---
    function loadPinConfig() {
        const saved = localStorage.getItem('smartfarm_pins');
        if (saved) {
            const config = JSON.parse(saved);
            Object.keys(pinInputs).forEach(key => {
                if (config[key]) {
                    pinInputs[key].value = config[key];
                }
            });
        }
    }
    loadPinConfig();

    // --- UI 업데이트 함수 ---
    
    function updateConnectionUI(connected) {
        isConnected = connected;
        if (connected) {
            btnConnect.textContent = '연결 해제';
            btnConnect.classList.replace('text-emerald-600', 'text-red-500');
            statusEl.textContent = '연결됨';
            statusEl.classList.replace('bg-red-500', 'bg-emerald-500');
        } else {
            btnConnect.textContent = '시리얼 연결';
            btnConnect.classList.replace('text-red-500', 'text-emerald-600');
            statusEl.textContent = '연결 끊김';
            statusEl.classList.replace('bg-emerald-500', 'bg-red-500');
            
            // 센서 값 초기화
            valTemp.textContent = '--';
            valHumid.textContent = '--';
            valLight.textContent = '--';
            valSoil.textContent = '--';
        }
    }

    // --- 시리얼 통신 콜백 설정 ---
    
    // 로그 출력 콜백
    serial.onLog = (msg) => {
        const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
        logEl.textContent += `[${time}] ${msg}\n`;
        // 자동 스크롤
        logEl.scrollTop = logEl.scrollHeight;
    };

    // 연결 해제 이벤트 콜백 (물리적 분리 등)
    serial.onDisconnect = () => {
        updateConnectionUI(false);
    };

    // 데이터 수신 콜백 (예: "H:45.5,T:23.0,L:620,S:150")
    serial.onDataReceived = (data) => {
        const parts = data.split(',');
        
        let updated = false;
        parts.forEach(part => {
            const [key, val] = part.split(':');
            if (val === undefined) return;
            
            const cleanVal = val.trim();
            const numVal = parseFloat(cleanVal);
            
            switch(key.trim()) {
                case 'H': 
                    valHumid.textContent = cleanVal; 
                    sensorData.humid.data.push(numVal);
                    updated = true;
                    break;
                case 'T': 
                    valTemp.textContent = cleanVal; 
                    sensorData.temp.data.push(numVal);
                    updated = true;
                    break;
                case 'L': 
                    valLight.textContent = cleanVal; 
                    sensorData.light.data.push(numVal);
                    updated = true;
                    break;
                case 'S': 
                    valSoil.textContent = cleanVal; 
                    sensorData.soil.data.push(numVal);
                    updated = true;
                    break;
            }
        });

        if (updated) {
            timeLabels.push('');
            if (timeLabels.length > MAX_DATA_POINTS) {
                timeLabels.shift();
                sensorData.temp.data.shift();
                sensorData.humid.data.shift();
                sensorData.light.data.shift();
                sensorData.soil.data.shift();
            }
            sensorChart.update();
        }
    };

    // --- 이벤트 리스너 바인딩 ---
    
    // 연결 버튼
    btnConnect.addEventListener('click', async () => {
        if (!isConnected) {
            try {
                const success = await serial.connect();
                if (success) {
                    updateConnectionUI(true);
                    
                    // 연결 성공 시, 로컬 스토리지에 저장된 핀 설정이 있다면 아두이노로 자동 전송하여 동기화
                    // 주의: 아두이노는 시리얼 연결 시 자동 리셋(Auto-Reset) 되므로 부팅 대기 시간이 필요합니다.
                    const savedPins = localStorage.getItem('smartfarm_pins');
                    if (savedPins) {
                        try {
                            const config = JSON.parse(savedPins);
                            // 부트로더 로딩을 기다리기 위해 2.5초 대기 후 전송
                            setTimeout(() => {
                                if (isConnected) {
                                    hw.sendPinConfig(config);
                                    setTimeout(() => { 
                                        hw.turnOffRgbLed(); 
                                        hw.turnOffPump(); 
                                    }, 100);
                                    console.log("자동 핀 동기화 완료:", config);
                                }
                            }, 2500);
                        } catch(e) {
                            console.error('핀 설정 로드 오류:', e);
                        }
                    }
                }
            } catch (error) {
                console.error("연결 에러 발생:", error);
                serial.log('연결 실패: ' + (error.message || '알 수 없는 에러'));
            }
        } else {
            await serial.disconnect();
            // onDisconnect 콜백에서 UI 업데이트 처리됨
        }
    });

    // 로그 지우기
    btnClearLog.addEventListener('click', () => {
        logEl.textContent = '';
    });

    pumpSpeed.addEventListener('input', (e) => {
        pumpSpeedVal.textContent = e.target.value;
        if (statusPump.textContent === '가동 중') {
            hw.turnOnPump(0, e.target.value);
        }
    });

    btnPumpOn.addEventListener('click', () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        hw.turnOnPump(0, pumpSpeed.value);
        statusPump.textContent = '가동 중';
        statusPump.classList.replace('bg-gray-200', 'bg-blue-100');
        statusPump.classList.replace('text-gray-600', 'text-blue-700');
    });

    btnPumpOff.addEventListener('click', () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        hw.turnOffPump();
        statusPump.textContent = '정지';
        statusPump.classList.replace('bg-blue-100', 'bg-gray-200');
        statusPump.classList.replace('text-blue-700', 'text-gray-600');
    });

    // RGB LED 버튼
    btnColorApply.addEventListener('click', () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        const hex = colorPicker.value;
        // Hex(#RRGGBB) 문자열을 R, G, B 정수로 변환
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        hw.setRgbLed(r, g, b);
    });

    btnColorOff.addEventListener('click', () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        hw.turnOffRgbLed();
    });

    // 부저 버튼 및 슬라이더
    buzzerFreq.addEventListener('input', (e) => {
        buzzerFreqVal.textContent = `${e.target.value} Hz`;
        // 만약 켜져있는 상태라면 실시간으로 주파수를 바꿈
        if (statusBuzzer.textContent === 'ON') {
            hw.turnOnBuzzer(e.target.value);
        }
    });

    btnBuzzerOn.addEventListener('click', () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        hw.turnOnBuzzer(buzzerFreq.value);
        statusBuzzer.textContent = 'ON';
        statusBuzzer.classList.replace('bg-gray-200', 'bg-red-100');
        statusBuzzer.classList.replace('text-gray-600', 'text-red-700');
    });

    btnBuzzerOff.addEventListener('click', () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        hw.turnOffBuzzer();
        statusBuzzer.textContent = 'OFF';
        statusBuzzer.classList.replace('bg-red-100', 'bg-gray-200');
        statusBuzzer.classList.replace('text-red-700', 'text-gray-600');
    });

    // 멜로디 연주
    const noteFreqs = {
        'C4': 262, 'C#4': 277, 'D4': 294, 'D#4': 311, 'E4': 330, 'F4': 349, 'F#4': 370, 'G4': 392, 'G#4': 415, 'A4': 440, 'A#4': 466, 'B4': 494,
        'C5': 523, 'C#5': 554, 'D5': 587, 'D#5': 622, 'E5': 659, 'F5': 698, 'F#5': 740, 'G5': 784, 'G#5': 831, 'A5': 880, 'A#5': 932, 'B5': 988
    };

    btnBuzzerPlay.addEventListener('click', async () => {
        if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
        const notes = buzzerMelody.value.trim().toUpperCase().split(/\s+/);
        if (notes.length === 0 || !notes[0]) return;

        btnBuzzerPlay.disabled = true;
        btnBuzzerPlay.textContent = '연주 중...';
        btnBuzzerPlay.classList.add('opacity-50', 'cursor-not-allowed');
        
        statusBuzzer.textContent = 'ON';
        statusBuzzer.classList.replace('bg-gray-200', 'bg-red-100');
        statusBuzzer.classList.replace('text-gray-600', 'text-red-700');

        for (let token of notes) {
            if (!isConnected) break; // 시리얼 끊기면 연주 중단
            
            // 토큰 파싱: "C4" 또는 "C4:0.5" 형태
            const parts = token.split(':');
            const note = parts[0];
            const durationMulti = parts.length > 1 ? parseFloat(parts[1]) : 1;
            const playTime = 400 * durationMulti;
            
            if (note === 'P' || note === ',' || !noteFreqs[note]) {
                // 쉼표 처리
                hw.turnOffBuzzer();
                await new Promise(r => setTimeout(r, playTime));
            } else {
                // 음표 재생
                const freq = noteFreqs[note];
                hw.turnOnBuzzer(freq);
                await new Promise(r => setTimeout(r, playTime)); // 박자 길이에 맞게 대기
                
                // 음 간 구분을 위해 아주 짧게 끄기
                hw.turnOffBuzzer();
                await new Promise(r => setTimeout(r, 50));
            }
        }

        hw.turnOffBuzzer();
        statusBuzzer.textContent = 'OFF';
        statusBuzzer.classList.replace('bg-red-100', 'bg-gray-200');
        statusBuzzer.classList.replace('text-red-700', 'text-gray-600');

        btnBuzzerPlay.disabled = false;
        btnBuzzerPlay.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"></path></svg>연주';
        btnBuzzerPlay.classList.remove('opacity-50', 'cursor-not-allowed');
    });

    // --- 피아노 건반 입력기 이벤트 ---
    const pianoKeys = document.querySelectorAll('.piano-key');
    const btnAddRest = document.getElementById('btn-add-rest');
    const btnBackspaceNote = document.getElementById('btn-backspace-note');
    const btnClearNotes = document.getElementById('btn-clear-notes');

    const appendNoteToMelody = async (baseNote) => {
        // 선택된 음 길이 가져오기
        const durationInput = document.querySelector('input[name="note-duration"]:checked');
        const duration = durationInput ? durationInput.value : "1";
        
        // 1박자가 아니면 "음계:길이" 형태로 생성 (예: C4:0.5)
        let noteStr = baseNote;
        if (duration !== "1" && baseNote !== "P") {
            noteStr = `${baseNote}:${duration}`;
        } else if (baseNote === "P" && duration !== "1") {
            noteStr = `P:${duration}`;
        }

        const currentVal = buzzerMelody.value.trim();
        buzzerMelody.value = currentVal ? `${currentVal} ${noteStr}` : noteStr;
        
        // 입력할 때 소리도 짧게 들려줌 (시리얼 연결 상태일 때만)
        if (isConnected && noteFreqs[baseNote]) {
            hw.turnOnBuzzer(noteFreqs[baseNote]);
            await new Promise(r => setTimeout(r, Math.min(200 * parseFloat(duration), 400))); // 길이에 비례하되 최대 0.4초
            hw.turnOffBuzzer();
        }
    };

    pianoKeys.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.isBlocklyRunning) { alert("블록 코딩이 실행 중일 때는 대시보드에서 제어할 수 없습니다."); return; }
            const note = btn.getAttribute('data-note');
            appendNoteToMelody(note);
        });
    });

    btnAddRest.addEventListener('click', () => {
        appendNoteToMelody('P');
    });

    btnBackspaceNote.addEventListener('click', () => {
        const notes = buzzerMelody.value.trim().split(/\s+/);
        if (notes.length > 0 && notes[0] !== "") {
            notes.pop(); // 마지막 요소 제거
            buzzerMelody.value = notes.join(' ');
        }
    });

    btnClearNotes.addEventListener('click', () => {
        buzzerMelody.value = '';
    });

    // --- 핀 설정 모달 이벤트 ---
    
    // 모달 열기
    btnPinConfig.addEventListener('click', () => {
        modalPinConfig.classList.remove('hidden');
    });

    // 모달 닫기
    btnCloseModal.addEventListener('click', () => {
        modalPinConfig.classList.add('hidden');
    });

    // 모달 배경 클릭 시 닫기
    modalPinConfig.addEventListener('click', (e) => {
        if (e.target === modalPinConfig) {
            modalPinConfig.classList.add('hidden');
        }
    });

    // 핀 설정 저장 및 전송
    btnSavePins.addEventListener('click', () => {
        const config = {
            dht: pinInputs.dht.value.trim(),
            light: pinInputs.light.value.trim(),
            soil: pinInputs.soil.value.trim(),
            pumpDir: pinInputs.pumpDir.value.trim(),
            pumpPwm: pinInputs.pumpPwm.value.trim(),
            buzzer: pinInputs.buzzer.value.trim(),
            rgbR: pinInputs.rgbR.value.trim(),
            rgbG: pinInputs.rgbG.value.trim(),
            rgbB: pinInputs.rgbB.value.trim(),
            rgbType: pinInputs.rgbType.value,
            pumpType: pinInputs.pumpType.value
        };

        // 빈 값이 있는지 확인
        const hasEmpty = Object.values(config).some(val => val === '');
        if (hasEmpty) {
            alert('모든 핀 번호를 입력해주세요.');
            return;
        }

        // 로컬 스토리지에 저장 (새로고침 시 유지)
        localStorage.setItem('smartfarm_pins', JSON.stringify(config));

        // 아두이노로 설정 전송
        if (isConnected) {
            hw.sendPinConfig(config);
            setTimeout(() => { hw.turnOffRgbLed(); }, 100);
            alert('핀 설정이 아두이노로 전송되었습니다.');
        } else {
            alert('설정은 저장되었으나 시리얼이 연결되지 않아 전송되지 않았습니다. 연결 후 다시 전송해주세요.');
        }

        modalPinConfig.classList.add('hidden');
    });

    // --- 펌웨어 업로드 로직 (Web Serial STK500) ---
    
    btnInstallFw.addEventListener('click', async () => {
        // 1. 이미 연결된 시리얼 포트가 있다면 끊기 (부트로더 진입을 위해 포트를 해제해야 함)
        if (isConnected) {
            await serial.disconnect();
        }

        modalFlash.classList.remove('hidden');
        btnCloseFlash.classList.add('hidden');
        flashProgressBar.style.width = '5%';
        flashStatusText.textContent = '펌웨어 파일(.hex) 다운로드 중...';

        try {
            // avrbro 라이브러리 지연 로드 (필요 시에만)
            if (!avrbro) {
                flashStatusText.textContent = 'avrbro 라이브러리 로딩 중...';
                try {
                    const module = await import('https://esm.sh/avrbro');
                    avrbro = module.default;
                } catch (loadErr) {
                    throw new Error('펌웨어 업로드 라이브러리(avrbro)를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');
                }
            }

            // 2. 서버(GitHub Pages)에서 펌웨어 바이너리 파일 다운로드
            const response = await fetch('firmware/smartfarm/smartfarm.ino.hex');
            if (!response.ok) {
                throw new Error('펌웨어 파일을 찾을 수 없습니다. (아두이노 IDE에서 컴파일된 바이너리 내보내기를 먼저 진행해주세요!)');
            }
            const data = await response.blob();
            
            // Blob 데이터를 ArrayBuffer로 변환 후 문자열 디코딩 -> hex 파싱
            const fileData = await new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(data);
            });
            const hexText = new TextDecoder("utf-8").decode(fileData);
            
            // 파일 포맷 검증 (무한 루프 방지)
            if (!hexText.trim().startsWith(':')) {
                throw new Error("올바른 아두이노 .hex 파일이 아닙니다. 파일 내용을 확인해주세요.");
            }
            const hexBuffer = avrbro.parseHex(hexText);

            flashProgressBar.style.width = '30%';
            flashStatusText.textContent = '아두이노 포트 선택 창을 열고 있습니다...';

            // 3. 포트 열기 (avrbro 사용)
            // 브라우저에서 포트 선택 창이 뜹니다.
            const avrSerial = await avrbro.openSerial({ baudRate: 115200 }); // Uno 기준
            if (!avrSerial) {
                throw new Error('사용자가 포트 선택을 취소했습니다.');
            }

            flashProgressBar.style.width = '50%';
            flashStatusText.textContent = '아두이노 리셋 중...';

            // 4. DTR 핀 토글하여 리셋
            await avrbro.reset(avrSerial);

            flashProgressBar.style.width = '70%';
            flashStatusText.textContent = '펌웨어 기록 중... (약 10~20초 소요)';

            // 5. 플래시 (STK500 프로토콜 통신)
            const success = await avrbro.flash(avrSerial, hexBuffer, { boardName: 'uno', debug: true });
            
            // 6. 포트 닫기
            await avrbro.closeSerial(avrSerial);

            if (success) {
                flashProgressBar.style.width = '100%';
                flashStatusText.textContent = '펌웨어 설치 완료! 아두이노 재부팅 및 자동 연결 중...';
                flashProgressBar.classList.replace('bg-blue-600', 'bg-emerald-500');
                
                // 아두이노 부트로더에서 스케치로 완전히 넘어갈 때까지 잠시 대기
                await new Promise(r => setTimeout(r, 1500));
                
                // 업로드에 사용했던 포트로 바로 일반 통신 연결
                const connected = await serial.connect(avrSerial.port);
                if (connected) {
                    updateConnectionUI(true);
                    flashStatusText.textContent = '펌웨어 설치 및 자동 연결이 성공적으로 완료되었습니다!';
                } else {
                    flashStatusText.textContent = '설치는 완료되었으나 자동 연결에 실패했습니다. 수동으로 연결해주세요.';
                    flashStatusText.classList.add('text-red-600');
                }
            } else {
                throw new Error('플래싱 도중 알 수 없는 오류가 발생했습니다.');
            }

        } catch (error) {
            flashProgressBar.style.width = '100%';
            flashProgressBar.classList.replace('bg-blue-600', 'bg-red-500');
            flashStatusText.textContent = `업로드 실패: ${error.message}`;
            flashStatusText.classList.add('text-red-600');
        } finally {
            // 닫기 버튼 활성화
            btnCloseFlash.classList.remove('hidden');
        }
    });

    btnCloseFlash.addEventListener('click', () => {
        modalFlash.classList.add('hidden');
        // 프로그레스 바 초기화
        flashProgressBar.style.width = '0%';
        flashProgressBar.classList.replace('bg-emerald-500', 'bg-blue-600');
        flashProgressBar.classList.replace('bg-red-500', 'bg-blue-600');
        flashStatusText.classList.remove('text-red-600');
    });

    // 블록 코딩 실행 상태에 따른 액추에이터 제어 버튼 비활성화 (Method 3)
    window.addEventListener('blockly-run-state-changed', (e) => {
        const isRunning = e.detail;
        const actuatorButtons = [
            btnPumpOn, btnPumpOff, btnColorApply, btnColorOff,
            btnBuzzerOn, btnBuzzerOff, btnBuzzerPlay,
            btnAddRest, btnBackspaceNote, btnClearNotes,
            ...pianoKeys
        ];
        
        actuatorButtons.forEach(btn => {
            if (btn) {
                btn.disabled = isRunning;
                if (isRunning) {
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    });
});
