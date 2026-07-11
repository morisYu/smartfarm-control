/**
 * custom_category.js
 * Blockly 툴박스 카테고리를 엔트리 스타일로 커스터마이징합니다.
 * 
 * Blockly 공식 API (ToolboxCategory 서브클래싱)를 사용합니다.
 * 참고: https://blocklycodelabs.dev/codelabs/custom-toolbox/
 */

// --- SVG 아이콘 생성 헬퍼 ---
function createSvgDataUri(svgContent) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">${svgContent}</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// --- 카테고리별 아이콘 정의 ---
const CATEGORY_ICONS = {
    '이벤트':       createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#FFBF00" opacity="0.18"/><path d="M18 6 L18 24 L30 18 Z" fill="#FFBF00"/><path d="M18 24 L18 42 L30 36 Z" fill="#D4A017"/>`),
    '논리':         createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#5B80A5" opacity="0.18"/><path d="M24 6 L6 24 L24 42 L42 24 Z" fill="#5B80A5"/><path d="M24 14 L14 24 L24 34 L34 24 Z" fill="white" opacity="0.35"/>`),
    '반복':         createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#E5A243" opacity="0.18"/><path d="M34 16 A12 12 0 1 0 34 32" stroke="#E5A243" stroke-width="4.5" fill="none" stroke-linecap="round"/><polygon points="34,10 41,18 27,18" fill="#E5A243"/>`),
    '수학':         createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#5CB1D6" opacity="0.18"/><text x="24" y="33" text-anchor="middle" font-size="30" font-weight="bold" fill="#5CB1D6" font-family="Arial">+</text>`),
    '문자열':       createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#E57E30" opacity="0.18"/><rect x="8" y="12" width="32" height="24" rx="6" fill="#E57E30"/><text x="24" y="29" text-anchor="middle" font-size="16" font-weight="bold" fill="white" font-family="Arial">Aa</text>`),
    '리스트':       createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#E55B73" opacity="0.18"/><rect x="10" y="10" width="8" height="6" rx="2" fill="#E55B73"/><rect x="22" y="10" width="16" height="6" rx="2" fill="#E55B73" opacity="0.5"/><rect x="10" y="21" width="8" height="6" rx="2" fill="#E55B73"/><rect x="22" y="21" width="16" height="6" rx="2" fill="#E55B73" opacity="0.5"/><rect x="10" y="32" width="8" height="6" rx="2" fill="#E55B73"/><rect x="22" y="32" width="16" height="6" rx="2" fill="#E55B73" opacity="0.5"/>`),
    '변수':         createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#E57E30" opacity="0.18"/><rect x="10" y="14" width="28" height="20" rx="5" fill="#E57E30"/><text x="24" y="29" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial">X=</text>`),
    '함수':         createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#B15CE6" opacity="0.18"/><path d="M14 16 h6 v6 h8 v-6 h6 v6 h0 v8 h-6 v6 h-8 v-6 h-6 Z" fill="#B15CE6" rx="2"/>`),
    '스마트팜 센서': createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#4CBFE6" opacity="0.18"/><path d="M24 40 L24 24" stroke="#2DA87A" stroke-width="3.5" stroke-linecap="round"/><path d="M24 24 Q14 14 18 6 Q22 12 24 9 Q26 12 30 6 Q34 14 24 24Z" fill="#4CBFE6"/><ellipse cx="24" cy="42" rx="8" ry="2.5" fill="#2DA87A" opacity="0.25"/>`),
    '스마트팜 제어': createSvgDataUri(`<rect rx="8" width="48" height="48" fill="#FF6680" opacity="0.18"/><path d="M24 8 Q13 20 13 28 A11 11 0 0 0 35 28 Q35 20 24 8Z" fill="#FF6680"/><path d="M24 18 Q18 26 18 30 A6 6 0 0 0 30 30 Q30 26 24 18Z" fill="white" opacity="0.3"/>`),
};

// --- 커스텀 카테고리 클래스 ---
class SmartFarmCategory extends Blockly.ToolboxCategory {
    constructor(categoryDef, toolbox, opt_parent) {
        super(categoryDef, toolbox, opt_parent);
    }

    /** @override - DOM 생성 직후 스타일 적용 */
    createDom_() {
        super.createDom_();

        // 각 카테고리 행(rowDiv) 스타일 직접 적용
        if (this.rowDiv_) {
            this.rowDiv_.style.padding = '12px 4px';
            this.rowDiv_.style.display = 'flex';
            this.rowDiv_.style.justifyContent = 'center';
            this.rowDiv_.style.alignItems = 'center';
            this.rowDiv_.style.cursor = 'pointer';
            this.rowDiv_.style.marginBottom = '4px';
            this.rowDiv_.style.borderRadius = '8px';

            if (this.name_ === '빈칸') {
                this.rowDiv_.style.opacity = '0';
                this.rowDiv_.style.pointerEvents = 'none';
                this.rowDiv_.style.cursor = 'default';
            }
        }

        // 아이콘+텍스트 컨테이너를 세로 배치
        const contentContainer = this.rowDiv_ && this.rowDiv_.querySelector('.blocklyTreeRowContentContainer');
        if (contentContainer) {
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.alignItems = 'center';
            contentContainer.style.gap = '6px';
        }

        // 툴박스 전체 스타일 
        setTimeout(() => {
            if (this.workspace_ && this.workspace_.getToolbox()) {
                const toolboxDiv = this.workspace_.getToolbox().HtmlDiv;
                if (toolboxDiv && !toolboxDiv.dataset.styled) {
                    toolboxDiv.style.backgroundColor = '#ffffff';
                    toolboxDiv.style.width = '110px';
                    toolboxDiv.style.borderRight = '1px solid #e2e8f0';
                    toolboxDiv.dataset.styled = 'true';
                }
            }
        }, 50);
        
        return this.htmlDiv_;
    }

    /** @override - 아이콘을 SVG 이미지로 교체 */
    createIconDom_() {
        const img = document.createElement('img');
        const name = this.name_;
        
        // 카테고리 이름에서 이모지 제거 후 매핑
        const cleanName = name.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\w\s]/g, '').trim();
        
        if (CATEGORY_ICONS[cleanName]) {
            img.src = CATEGORY_ICONS[cleanName];
        }
        
        img.alt = cleanName;
        img.width = 36;
        img.height = 36;
        img.style.display = 'block';
        img.style.margin = '0 auto';
        return img;
    }

    /** @override - 라벨에서 이모지를 제거하고 텍스트만 표시 */
    createLabelDom_(name) {
        const label = document.createElement('span');
        label.setAttribute('id', this.getId() + '.label');
        label.textContent = name.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\w\s]/g, '').trim();
        label.classList.add('blocklyToolboxCategoryLabel');
        // 인라인 스타일로 확실하게 적용
        label.style.fontSize = '13px';
        label.style.fontWeight = '700';
        label.style.color = '#334155';
        label.style.textAlign = 'center';
        label.style.display = 'block';
        label.style.lineHeight = '1.2';
        return label;
    }

    /** @override - 색상 바 대신 아무것도 안 함 (깔끔하게) */
    addColourBorder_(colour) {
        // 기본 색상 바를 제거하고 깨끗한 디자인 유지
    }

    /** @override - 선택 시 시각적 피드백 */
    setSelected(isSelected) {
        if (isSelected) {
            this.rowDiv_.style.backgroundColor = '#f0f9ff';
        } else {
            this.rowDiv_.style.backgroundColor = '';
        }
        Blockly.utils.aria.setState(
            /** @type {!Element} */ (this.htmlDiv_),
            Blockly.utils.aria.State.SELECTED, isSelected
        );
    }
}

// --- Blockly에 커스텀 카테고리 등록 (기본 카테고리를 대체) ---
Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    SmartFarmCategory,
    true  // 기존 등록을 덮어씀
);
