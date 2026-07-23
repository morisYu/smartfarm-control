/**
 * kit-registry.js
 * 아두이노 키트 레지스트리 - 각 키트가 자신의 설정을 등록하는 전역 저장소
 * 
 * 새 키트 추가 시 js/kits/[키트이름].js 파일에서 KitRegistry.register()를 호출합니다.
 */
window.KitRegistry = {
    kits: {},

    /**
     * 키트를 레지스트리에 등록합니다.
     * @param {string} kitId - 키트 고유 ID (예: 'smartfarm', 'handino')
     * @param {Object} config - 키트 설정 객체
     * @param {string} config.name - 키트 표시 이름
     * @param {string} config.icon - 키트 이모지 아이콘
     * @param {string} config.color - 키트 테마 컬러 (hex)
     * @param {string} config.headerColorClass - Tailwind 헤더 배경 클래스
     * @param {Array} config.sensors - 센서 정의 배열
     * @param {Array} config.actuators - 액추에이터 정의 배열
     * @param {Object} config.pinConfig - 핀 설정 정의
     * @param {string} config.firmware - firmware 폴더명
     * @param {Array} config.blockDefs - Blockly 블록 정의 (JSON 배열)
     * @param {Object} config.jsGenerators - Blockly JS 코드 생성기 {blockType: function}
     * @param {Object} config.cGenerators - Blockly C 코드 생성기 {blockType: function}
     * @param {Array} config.toolboxCategories - 키트 전용 Blockly toolbox 카테고리 XML 문자열 배열
     * @param {Object} config.categoryIcons - 키트 전용 카테고리 아이콘 {name: svgDataUri}
     * @param {Function} config.parseData - 시리얼 데이터 파싱 함수 (data, sensorValues) => boolean
     * @param {Function} config.onConnect - 연결 시 초기화 함수 (hw) => void
     * @param {Function} [config.renderActuatorExtras] - 액추에이터 패널에 추가 UI 렌더링 (container) => void
     * @param {Function} [config.bindActuatorEvents] - 액추에이터 이벤트 바인딩 (hw, serial, isConnectedFn) => void
     */
    register(kitId, config) {
        this.kits[kitId] = config;
        console.log(`[KitRegistry] 키트 등록: ${config.name} (${kitId})`);
    },

    /**
     * 등록된 키트 설정을 반환합니다.
     * @param {string} kitId
     * @returns {Object|undefined}
     */
    get(kitId) {
        return this.kits[kitId];
    },

    /**
     * 모든 키트 설정을 반환합니다.
     * @returns {Object}
     */
    getAll() {
        return this.kits;
    },

    /**
     * 등록된 모든 키트 ID를 반환합니다.
     * @returns {string[]}
     */
    getIds() {
        return Object.keys(this.kits);
    },

    /**
     * 첫 번째 등록된 키트 ID를 반환합니다 (기본값).
     * @returns {string|undefined}
     */
    getDefaultId() {
        const ids = this.getIds();
        return ids.length > 0 ? ids[0] : undefined;
    }
};
