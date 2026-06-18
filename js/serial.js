/**
 * serial.js
 * Web Serial API를 활용한 아두이노 통신 코어 모듈
 * 
 * 향후 Blockly 환경에서도 접근 가능하도록 전역 네임스페이스(window.SmartFarmSerial)에 등록
 */
window.SmartFarmSerial = {
    port: null,
    reader: null,
    readableStreamClosed: null,
    keepReading: true,
    
    // 콜백 함수들
    onDataReceived: null,
    onLog: null,
    onDisconnect: null,

    log: function(msg) {
        console.log("[Serial]", msg);
        if (this.onLog) this.onLog(msg);
    },

    /**
     * 시리얼 포트 연결 요청
     */
    connect: async function(existingPort = null) {
        if (!('serial' in navigator)) {
            alert('Web Serial API를 지원하지 않는 브라우저입니다.\nChrome, Edge 등 Chromium 기반 브라우저를 사용해주세요.');
            return false;
        }

        try {
            if (existingPort) {
                this.port = existingPort;
            } else {
                // 사용자에게 포트 선택 창 표시 (안드로이드 크롬 호환성을 위한 필터 추가)
                const filters = [
                    { usbVendorId: 0x2341 }, // 정품 아두이노 Uno/Nano
                    { usbVendorId: 0x1a86 }, // 중국산 호환 보드 CH340
                    { usbVendorId: 0x10c4 }  // CP2102 호환 칩셋
                ];
                this.port = await navigator.serial.requestPort({ filters });
            }
            // 기본 아두이노 보드레이트 9600 사용
            await this.port.open({ baudRate: 9600 });
            this.keepReading = true;
            
            this.log('시리얼 포트 연결 성공!');
            
            // 물리적 연결 끊김 감지 (USB 선 뽑힘 등)
            navigator.serial.addEventListener('disconnect', (event) => {
                if (event.target === this.port) {
                    this.log('장치가 물리적으로 분리되었습니다.');
                    this.handleDisconnect();
                }
            });

            // 비동기로 수신 루프 시작
            this.readLoop();
            return true;

        } catch (error) {
            this.log('연결 실패: ' + error.message);
            return false;
        }
    },

    /**
     * 수동으로 연결 종료
     */
    disconnect: async function() {
        this.keepReading = false;
        
        // 1. 읽기 스트림 취소 (read 루프 종료 유도)
        if (this.reader) {
            try {
                await this.reader.cancel();
            } catch(e) {}
        }
        
        // 2. 스트림 파이프라인이 완전히 닫힐 때까지 대기 (필수!)
        if (this.readableStreamClosed) {
            try {
                await this.readableStreamClosed;
            } catch(e) {}
        }
        
        this.handleDisconnect();
    },

    /**
     * 내부 연결 해제 처리 로직
     */
    handleDisconnect: async function() {
        if (this.port) {
            try {
                await this.port.close();
            } catch(e) {
                this.log('포트 닫기 오류: ' + e.message);
            }
            this.port = null;
        }
        this.log('시리얼 포트 연결이 해제되었습니다.');
        if (this.onDisconnect) this.onDisconnect();
    },

    commandQueue: [],
    isWriting: false,

    clearQueue: function() {
        this.commandQueue = [];
    },

    /**
     * 아두이노로 명령어 전송 (핵심 전송 함수)
     * @param {string} cmd 전송할 명령어 문자열 (반드시 \n 포함 여부 확인)
     */
    sendCommand: function(cmd) {
        if (!this.port || !this.port.writable) {
            this.log('전송 실패: 포트가 연결되지 않았습니다. (명령: ' + cmd.trim() + ')');
            return;
        }

        this.commandQueue.push(cmd);
        // 너무 많은 명령어가 쌓여 메모리가 누수되는 것을 방지
        if (this.commandQueue.length > 50) {
            this.commandQueue.shift();
        }

        this.processQueue();
    },

    processQueue: async function() {
        if (this.isWriting) return;
        this.isWriting = true;

        while (this.commandQueue.length > 0) {
            const cmd = this.commandQueue.shift();
            try {
                const encoder = new TextEncoder();
                const writer = this.port.writable.getWriter();
                await writer.write(encoder.encode(cmd));
                writer.releaseLock();
                this.log('송신: ' + cmd.trim());
            } catch (error) {
                this.log('송신 오류: ' + error.message);
            }
        }
        
        this.isWriting = false;
    },

    /**
     * 수신 루프 (데이터 읽기)
     */
    readLoop: async function() {
        while (this.port && this.port.readable && this.keepReading) {
            const decoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(decoder.writable);
            this.reader = decoder.readable.getReader();

            let buffer = '';

            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value) {
                        buffer += value;
                        // 개행 문자(\n) 기준으로 패킷 분리
                        let lines = buffer.split('\n');
                        // 마지막 요소는 아직 불완전할 수 있으므로 버퍼에 남김
                        buffer = lines.pop(); 

                        for (let line of lines) {
                            line = line.trim();
                            if (line && this.onDataReceived) {
                                this.onDataReceived(line);
                            }
                        }
                    }
                }
            } catch (error) {
                // 스트림 읽기 에러 발생 (포트 닫힘 등)
                // this.log('수신 루프 중지: ' + error.message);
            } finally {
                this.reader.releaseLock();
            }
        }
    }
};
