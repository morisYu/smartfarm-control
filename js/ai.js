window.AI = (function() {
    let handsModel = null;
    let cameraStream = null;
    let videoElement = null;
    let containerElement = null;
    let lastHandResult = null;
    let resolveRecognition = null;
    
    let isModelLoading = false;

    // 초기화 및 DOM 요소 생성
    function initVisionDOM() {
        if (document.getElementById('ai-vision-container')) return;
        
        containerElement = document.createElement('div');
        containerElement.id = 'ai-vision-container';
        containerElement.className = 'fixed bottom-4 right-4 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-violet-500 z-50 hidden flex flex-col';
        containerElement.style.resize = 'both';
        
        const dragHeader = document.createElement('div');
        dragHeader.className = 'h-6 bg-violet-600 w-full flex items-center justify-center cursor-move select-none flex-shrink-0';
        dragHeader.innerHTML = '<span class="text-white text-xs font-bold tracking-wide">🖐️ AI Camera</span>';
        
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        dragHeader.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = containerElement.getBoundingClientRect();
            // 기존의 bottom/right 속성을 제거하고 left/top으로 고정 (드래그 시 튐 현상 방지)
            containerElement.style.bottom = 'auto';
            containerElement.style.right = 'auto';
            containerElement.style.left = rect.left + 'px';
            containerElement.style.top = rect.top + 'px';
            
            initialLeft = rect.left;
            initialTop = rect.top;
            
            dragHeader.setPointerCapture(e.pointerId);
            e.preventDefault();
        });

        dragHeader.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            containerElement.style.left = (initialLeft + dx) + 'px';
            containerElement.style.top = (initialTop + dy) + 'px';
        });

        const stopDrag = (e) => {
            if (isDragging) {
                isDragging = false;
                dragHeader.releasePointerCapture(e.pointerId);
            }
        };
        dragHeader.addEventListener('pointerup', stopDrag);
        dragHeader.addEventListener('pointercancel', stopDrag);
        
        videoElement = document.createElement('video');
        videoElement.className = 'w-full h-full object-cover transform -scale-x-100 flex-1'; // 거울 모드
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        
        containerElement.appendChild(dragHeader);
        containerElement.appendChild(videoElement);
        document.body.appendChild(containerElement);
    }

    // MediaPipe 스크립트 동적 로드
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function initHandsModel() {
        if (handsModel) return;
        if (isModelLoading) {
            // 다른 호출이 로딩 중이면 기다림
            while(isModelLoading) {
                await new Promise(r => setTimeout(r, 100));
            }
            return;
        }
        
        isModelLoading = true;
        try {
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
            
            handsModel = new window.Hands({locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }});
            
            handsModel.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            handsModel.onResults((results) => {
                lastHandResult = results;
                if (resolveRecognition) {
                    resolveRecognition(results);
                    resolveRecognition = null;
                }
            });
            
            // 더미 이미지로 모델 웜업(초기 로딩 지연 방지)
            const dummyCanvas = document.createElement('canvas');
            dummyCanvas.width = 64; dummyCanvas.height = 64;
            await handsModel.send({image: dummyCanvas});
            
        } catch(e) {
            console.error("Hands Model Load Error:", e);
        } finally {
            isModelLoading = false;
        }
    }

    // 두 점 사이의 거리 계산
    function dist(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    return {
        /**
         * 1. TTS 음성 합성 (비동기 대기)
         */
        speakText: function(text) {
            return new Promise((resolve) => {
                if (!window.speechSynthesis) {
                    resolve();
                    return;
                }
                window.speechSynthesis.cancel(); // 기존 음성 취소
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ko-KR';
                utterance.rate = 1.0;
                
                utterance.onend = () => { resolve(); };
                utterance.onerror = () => { resolve(); };
                
                window.speechSynthesis.speak(utterance);
            });
        },
        
        stopSpeech: function() {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        },

        /**
         * 2. 손 모양 인식 (카메라) 시작
         */
        startHandTracking: async function() {
            initVisionDOM();
            
            if (!cameraStream) {
                try {
                    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
                    videoElement.srcObject = cameraStream;
                    containerElement.classList.remove('hidden');
                } catch(e) {
                    console.error("카메라 권한 거부됨", e);
                    alert("카메라 권한을 허용해야 손 모양을 인식할 수 있습니다.");
                    return;
                }
            }
            
            await initHandsModel();
        },

        /**
         * 3. 손 모양 인식 중지
         */
        stopHandTracking: function() {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
            if (containerElement) {
                containerElement.classList.add('hidden');
            }
            if (videoElement) {
                videoElement.srcObject = null;
            }
            lastHandResult = null;
        },

        /**
         * 4. 1프레임 캡처 및 인식 수행
         */
        recognizeHand: function() {
            return new Promise(async (resolve) => {
                if (!handsModel || !videoElement || videoElement.paused) {
                    lastHandResult = null;
                    resolve(null);
                    return;
                }
                
                resolveRecognition = resolve;
                try {
                    await handsModel.send({image: videoElement});
                } catch(e) {
                    console.error("인식 중 오류:", e);
                    if (resolveRecognition) {
                        resolveRecognition(null);
                        resolveRecognition = null;
                    }
                }
            });
        },

        /**
         * 5. 특정 손가락 접힘 여부 반환 (동기 함수)
         */
        isFingerFolded: function(finger) {
            if (!lastHandResult || !lastHandResult.multiHandLandmarks || lastHandResult.multiHandLandmarks.length === 0) {
                return false;
            }
            const landmarks = lastHandResult.multiHandLandmarks[0];
            
            if (finger === 'thumb') {
                return dist(landmarks[4], landmarks[17]) < dist(landmarks[2], landmarks[17]);
            } else {
                const tip = { 'index': 8, 'middle': 12, 'ring': 16, 'pinky': 20 }[finger];
                const mcp = tip - 3; // 5, 9, 13, 17
                return dist(landmarks[tip], landmarks[0]) < dist(landmarks[mcp], landmarks[0]);
            }
        },

        /**
         * 6. 특정 손가락 굽힘 각도 (0~180) 반환
         */
        getFingerAngle: function(finger) {
            if (!lastHandResult || !lastHandResult.multiHandLandmarks || lastHandResult.multiHandLandmarks.length === 0) {
                return 180; // 기본은 편 상태
            }
            const landmarks = lastHandResult.multiHandLandmarks[0];
            let ratio = 1;
            
            if (finger === 'thumb') {
                ratio = dist(landmarks[4], landmarks[17]) / dist(landmarks[2], landmarks[17]);
            } else {
                const tip = { 'index': 8, 'middle': 12, 'ring': 16, 'pinky': 20 }[finger];
                const mcp = tip - 3;
                ratio = dist(landmarks[tip], landmarks[0]) / dist(landmarks[mcp], landmarks[0]);
            }
            
            // 비율을 각도로 매핑 (0.8 = 접힘(0도), 1.8 = 펴짐(180도))
            let angle = (ratio - 0.8) * (180 / 1.0);
            return Math.max(0, Math.min(180, Math.floor(angle)));
        },

        /**
         * 7. 사전 정의된 제스처 판별
         */
        isGesture: function(gesture) {
            if (!lastHandResult || !lastHandResult.multiHandLandmarks || lastHandResult.multiHandLandmarks.length === 0) {
                return false;
            }
            
            const thumb = this.isFingerFolded('thumb');
            const index = this.isFingerFolded('index');
            const middle = this.isFingerFolded('middle');
            const ring = this.isFingerFolded('ring');
            const pinky = this.isFingerFolded('pinky');
            
            switch(gesture) {
                case 'rock': // 모두 접음
                    return thumb && index && middle && ring && pinky;
                case 'paper': // 모두 폄
                    return !thumb && !index && !middle && !ring && !pinky;
                case 'scissors': // 검지, 중지만 폄
                    return thumb && !index && !middle && ring && pinky;
                case 'love': // 검지, 소지, 엄지 폄 / 중지, 약지 접음 (ILY sign)
                    return !thumb && !index && middle && ring && !pinky;
                default:
                    return false;
            }
        }
    };
})();
