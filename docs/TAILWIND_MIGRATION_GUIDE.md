# Tailwind CSS 마이그레이션 현황 및 리팩토링 가이드

> 작성일: 2026-08-12
> 브랜치: Phase A/B → `main`, Phase C → `develop`

---

## 요약

| 항목 | 수치 |
|---|---|
| **전체 대상 파일** | 27개 |
| **변환 완료** | 20개 |
| **미완료 (스킵)** | 7개 |
| **총 줄수 감소** | +1,822줄 / -6,865줄 (순 **5,043줄 감소**) |

### 하이브리드 전략

- **Tailwind로 이동**: 타이포그래피, 간격, 색상, 단순 flex 레이아웃
- **CSS에 유지**: `@keyframes`, `::before/::after`, radial-gradient sphere, 복잡 반응형, 동적 클래스 바인딩 대상 클래스
- **마커**: 유지 사유는 `/* [TW-KEEP] */` 주석으로 CSS 파일에 표시됨

---

## Phase A (완료 ✅ — `main`)

비교적 단순한 페이지. 하이브리드 변환 완료.

| 파일 | 원본 CSS | 변환 후 | 감소율 |
|---|---|---|---|
| terms | 119줄 | 30줄 | -75% |
| privacy | 119줄 | 30줄 | -75% |
| about | 204줄 | 50줄 | -76% |
| withdraw | 149줄 | 40줄 | -73% |
| inquiry-detail | 238줄 | 60줄 | -75% |
| profile-edit | 295줄 | 70줄 | -76% |
| sub-header | 130줄 | 35줄 | -73% |
| notice-detail | 280줄 | 72줄 | -74% |
| k-digital | 341줄 | 85줄 | -75% |
| my-bootcamp | 361줄 | 90줄 | -75% |
| search | 458줄 | 100줄 | -78% |

---

## Phase B (완료 ✅ — `main`)

중간 복잡도. sphere/keyframes/에디터 구조는 CSS 유지, 폼/타이포 Tailwind.

| 파일 | 원본 CSS | 변환 후 | 감소율 | CSS 유지 이유 |
|---|---|---|---|---|
| find-password | 244줄 | 70줄 | -71% | sphere keyframes/gradient |
| find-email | 311줄 | 100줄 | -68% | sphere/dropdown 구조 |
| upload | 243줄 | 105줄 | -57% | keyframes/모달/타원 장식 |
| inquiry-form | 483줄 | 75줄 | -85% | 히어로/에디터/spinner |
| assignment-submit | 406줄 | 130줄 | -68% | 탭/에디터/드롭존/spinner |

**Phase B 스킵 (CSS 유지):**
- `lecture-detail` (852줄) — 3단계+ 반응형 핵심
- `assignment-detail` (967줄) — 3단계+ 반응형 핵심
- `my-bootcamp-detail` (887줄) — 3단계+ 반응형 핵심

---

## Phase C (부분 완료 — `develop`)

### 변환 완료 ✅

| 파일 | 원본 CSS | 변환 후 | 감소율 | CSS 유지 이유 |
|---|---|---|---|---|
| signup | 472줄 | 140줄 | -70% | sphere/tooltip `::before/::after`/dropdown |
| login | 472줄 | 100줄 | -79% | sphere/tooltip/checkbox |
| hall-of-fame | 502줄 | 160줄 | -68% | card animation/`::before`/모달 keyframes/왕관 |
| student-portfolio-detail | 1023줄 | 150줄 | -85% | 모달 3개 overlay/뷰어/마스크 |

### 미완료 (스킵) ❌

아래 파일들은 **동적 클래스 바인딩 + 복합 CSS 구조** 때문에 하이브리드 변환의 실익이 낮아 스킵.

---

## 미완료 파일 상세 분석

### 1. `home` — 1115줄 CSS, 295줄 HTML

**스킵 사유:** 캐러셀/카드/그리드/반응형 전체가 CSS 구조에 깊이 의존

**CSS 구조 의존 요소:**
- 캐러셀 (`scroll-snap-type`, `scrollbar-width: none`, `::-webkit-scrollbar`)
- 코멘트 카드 (540×272 고정, `card-content` 409px + `card-thumbnail` 131px 분할)
- 갤러리 카드 그리드 (4→3→2열 반응형: `calc(25% - 18px)` → `calc(33.333% - 16px)` → `calc(50% - 12px)`)
- 멘토 카드 (데코 타원 + 삼각형 포인터 + 뱃지)
- 필터 탭 + 검색 바 (`.filter-tab--active` 동적 상태)
- `carousel-fade` 그래디언트 오버레이
- 9개 `@media` 쿼리

**리팩토링 전략:**
```
1. [ngClass] 삼항연산자로 동적 상태 처리
   기존: [class.filter-tab--active]="activeCategory() === cat.id"
   변경: [ngClass]="activeCategory() === cat.id 
          ? 'bg-white border-zinc-700 text-zinc-800' 
          : 'bg-transparent border-zinc-700 text-zinc-500'"

2. group/group-hover로 parent→child hover 처리
   기존 CSS: .gallery-card:hover { transform: translateY(-4px) }
   변경: gallery-card에 class="group", child에 class="group-hover:xxx"

3. 반응형은 Tailwind 브레이크포인트로 1:1 대체
   @media (max-width: 1440px) → xl:
   @media (max-width: 1200px) → lg:
   @media (max-width: 768px)  → md:

4. 캐러셀: snap-x snap-mandatory overflow-x-auto scrollbar-hide
```

---

### 2. `content-upload` — 1053줄 CSS, 450줄 HTML

**스킵 사유:** 칩/세그먼트/아코디언 토글 + 3개 모달의 CSS 클래스 상태 관리

**CSS 구조 의존 요소:**
- 칩 (`cu-chip` + `cu-chip-active`) — `[class.cu-chip-active]`
- 세그먼트 (`cu-segment` + `cu-segment-active`) — `[class.cu-segment-active]`
- 아코디언 토글 (`cu-toggle-open`) — `[class.cu-toggle-open]`
- 썸네일 선택 모달 (`tm-modal`, `tm-item-selected`)
- 크롭 모달 (`tm-modal-crop`)
- 앨범 선택 모달 (`am-modal`, `am-item-selected`)
- 스피너 (`cu-spinner`)
- 2-column 레이아웃 (`cu-left` 860px + `cu-right`)

**리팩토링 전략:**
```
1. 칩/세그먼트: [ngClass] 삼항연산자
   [ngClass]="selectedCategory() === cat.name 
     ? 'bg-accent/10 border-accent text-accent' 
     : 'bg-transparent border-zinc-700 text-zinc-500'"

2. 아코디언 토글: SVG transform을 [style.transform] 직접 바인딩
   [style.transform]="isDetailOpen() ? 'rotate(180deg)' : 'none'"

3. 모달: 공통 모달 컴포넌트로 추출 후 Tailwind 적용
   (tm-modal, am-modal 패턴이 거의 동일하므로 재사용 가능)
```

---

### 3. `header` — 1194줄 CSS

**스킵 사유:** 앱 전체 네비게이션. 변경 시 전 페이지 영향

> ⚠️ **header는 가장 마지막에 리팩토링해야 합니다. 모든 페이지 변환 완료 후 진행 권장.**

**CSS 구조 의존 요소:**
- 네비게이션 드롭다운 (hover/click 토글)
- 모바일 메뉴 (slide-in)
- 알림 패널
- 프로필 메뉴
- 반응형 breakpoint별 레이아웃 전환

---

### 4. `profile` — 1202줄 CSS, 727줄 HTML

**스킵 사유:** 동적 클래스 바인딩 20개+, 앨범 슬라이더/드롭다운/모달 6개

**CSS 구조 의존 요소:**
- 탭 (`pf-tab-active`) — `[class.pf-tab-active]`
- 탭 뱃지 (`pf-tab-badge-active`) — `[class.pf-tab-badge-active]`
- 앨범 카드 (`pf-album-card-active`) — `[class.pf-album-card-active]`
- 드롭다운 (`pf-dropdown-chevron-open`, `pf-dropdown-option-active`)
- 체크박스 (`modal-checkbox-checked`) — `[class.modal-checkbox-checked]`
- 앨범 슬라이더 (scroll + fade + arrow)
- 콘텐츠 그리드
- 모달 6개 (새앨범, 새카테고리, 수정, 삭제 × 2, 앨범수정)

**리팩토링 전략:**
```
1. 모달 6개 → 공통 모달 컴포넌트 추출
   현재 modal-overlay/modal-shell/modal-header/modal-body/modal-footer 
   패턴이 6회 반복. 공통 컴포넌트로 추출하면 ~300줄 감소.

2. 앨범 카드도 앨범/카테고리 탭에서 거의 동일 템플릿 반복.
   공통 album-card 컴포넌트 추출 가능.

3. 탭/뱃지: [ngClass] 삼항연산자로 전환
```

---

### 5. `content-detail` — 2502줄 CSS, 758줄 HTML (최대 파일)

**스킵 사유:** 동적 클래스 바인딩 11개+, 2-column 사이드바/피드백 마커/드롭다운/모달 전체가 CSS 의존

**동적 클래스 바인딩 목록:**

| 동적 클래스 | 바인딩 위치 | 역할 |
|---|---|---|
| `.active` | `detail-action-btn` | 책갈피 활성 |
| `.sidebar-closed` | `detail-right` | 사이드바 접기 |
| `.rotated` | `detail-collapse-btn svg` | 아코디언 화살표 |
| `.feedback-cursor` | `detail-images` | 피드백 마커 모드 커서 |
| `.floating-add-active` | `floating-add` | 마커 추가 활성 |
| `.marker-btn-active` | `compose-marker-btn` | 마커 버튼 활성 |
| `.filter-tab.active` | `filter-tab` | 댓글 필터 탭 |
| `.filter-count.active` | `filter-count` | 필터 카운트 뱃지 |
| `.comment-active` | `comment-item` | 댓글 활성화 |
| `.marker-active` | `comment-marker` | 마커 활성화 |
| `.translate-dropdown-item--active` | 번역 드롭다운 | 선택된 언어 |

**추가 복잡도:**
- 2-column 레이아웃 (`detail-left` flex:1 + `detail-right` 440px)
- floating 버튼 그룹 (position: sticky)
- pending-marker (`[style.top.px]`, `[style.left.px]` 동적 위치)
- 댓글 드롭다운 (position: absolute + overlay)
- 공유/신고/삭제 모달 3개+

**리팩토링 전략:**
```
1. 사이드바 토글:
   [style.width]="isSidebarOpen() ? '440px' : '0px'"
   [style.opacity]="isSidebarOpen() ? '1' : '0'"
   transition-all duration-300 으로 처리

2. 댓글 필터 탭: [ngClass] 삼항연산자
   [ngClass]="activeCommentTab() === 'all' 
     ? 'text-white border-b-2 border-accent' 
     : 'text-zinc-500'"

3. 피드백 마커 모드: 
   [style.cursor]="commentMode() === 'feedback' ? 'crosshair' : 'default'"

4. 모달 공통 컴포넌트 추출 (share/report/delete 동일 패턴)

5. floating 버튼: sticky bottom-4 right-4 z-50 flex flex-col gap-2
```

---

## 리팩토링 우선순위 권장

```
1단계: 공통 컴포넌트 추출
  ├── 모달 공통 컴포넌트
  └── 앨범 카드 컴포넌트

2단계: 중간 복잡도 페이지
  ├── content-upload
  └── profile

3단계: 대형 페이지
  ├── home
  └── content-detail

4단계: header (최후)
```

---

## 핵심 패턴: `[class.xxx]` → `[ngClass]` 전환

리팩토링의 핵심은 Angular 동적 클래스 바인딩 패턴을 바꾸는 것입니다.

**Before (CSS 클래스 기반):**
```html
<button class="filter-tab" [class.active]="isActive">탭</button>
```
```css
.filter-tab { color: #71717A; border-bottom: 2px solid transparent; }
.filter-tab.active { color: #FFFFFF; border-bottom-color: #7A48FF; }
```

**After (Tailwind + ngClass):**
```html
<button 
  [ngClass]="isActive 
    ? 'text-white border-b-2 border-accent' 
    : 'text-zinc-500 border-b-2 border-transparent'"
>탭</button>
```

이 패턴만 통일하면 나머지는 기계적으로 Tailwind 유틸리티로 변환 가능합니다.

---

## 환경 참고

- **Tailwind 설정**: `tailwind.config.js` — `font-suit`, `accent` (#7A48FF) 커스텀 정의됨
- **`@tailwind base` 비활성화**: `styles.css`에서 기존 CSS reset 충돌 방지를 위해 제거됨
- **빌드**: `@angular/build:application`
- **CSS 유지 마커**: `/* [TW-KEEP] */` 주석으로 유지 사유 표시됨
