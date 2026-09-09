# 히어로 배너 텍스트 스케일링 문제 해결

> **적용 대상**: `/k-digital` 페이지 히어로 배너  
> **해결일**: 2026-09-09  
> **커밋**: `8d15ab5`

---

## 문제 현상

큰 모니터(1441px 이상)에서 히어로 배너의 "부트캠프" 텍스트가:
1. SVG 배경 박스와 위치가 어긋남 (박스는 비례 확대, 텍스트는 고정)
2. 텍스트 하단이 잘림 (드래그하면 보이지만 평상시 잘려 보임)

작은 화면에서는 정상.

## 근본 원인

### 원인 1: 고정 px vs 비례 스케일링 불일치

| 요소 | 스케일 방식 | 큰 화면에서 |
|------|-----------|-----------|
| SVG 배경 박스 | `background-size: 100% 100%` → 비례 확대 | 박스 위치가 비례로 이동 |
| HTML 텍스트 위치 | `padding-top: 105px` → 고정 | 텍스트 위치 고정 → **박스와 어긋남** |
| HTML 텍스트 크기 | `font-size: 40px` → 고정 | 박스 대비 텍스트가 작아 보임 |

### 원인 2: line-height < font-size 클리핑 ⚠️ 핵심

```css
/* 원래 코드 */
h1 {
  font-size: 40px;       /* 고정 */
  line-height: 46px;     /* 고정 — 40px 보다 큼 → OK */
}

/* 큰 화면 스케일링 추가 후 */
h1 {
  font-size: 2.3vw;      /* 2560px에서 58.88px */
  line-height: 46px;     /* 여전히 46px 고정! → 58px > 46px → 텍스트 하단 잘림! */
}
```

**`line-height`가 `font-size`보다 작으면 텍스트 상/하단이 잘린다.**  
이것이 "드래그하면 보이는데 평상시 잘리는" 현상의 원인.

---

## 해결 방법

### 파일: `k-digital.page.html`

CSS 클래스 `kd-hero-title`, `kd-hero-subtitle` 추가 (미디어쿼리 타겟팅용):

```html
<h1 class="kd-hero-title font-bold text-[40px] leading-[46px] ...">
<p class="kd-hero-subtitle font-medium text-[clamp(14px,1.2vw,20px)] ...">
```

### 파일: `k-digital.page.css`

≤1440px은 원래 고정값 그대로 유지. **1441px 이상에서만** 비례 스케일링 적용:

```css
/* 큰 화면 — 텍스트를 배너 박스 비율에 맞게 스케일 */
@media (min-width: 1441px) {
  .kd-hero {
    padding-top: 6.2%;              /* 105px/1920px 기반 비율 — 박스와 동일 상대위치 */
  }
  .kd-hero-title {
    font-size: 2.3vw !important;    /* 40px → 비례 확대 */
    line-height: 120% !important;   /* ⚠️ 핵심! 46px 고정 → 비례로 변경 */
    margin-top: -1.04vw !important; /* -20px → 비례 */
  }
  .kd-hero-subtitle {
    font-size: 1.15vw !important;   /* clamp값 → 비례 확대 */
    margin-top: 1.8vw !important;   /* 24px → 비례 */
  }
}
```

---

## 핵심 체크리스트 (재발 방지)

- [ ] `font-size`를 `vw` 등 반응형으로 변경할 때 **반드시 `line-height`도 같이 변경**
- [ ] `line-height`는 고정 `px` 대신 `%` 또는 `em` 사용 권장 (예: `120%`, `1.2em`)
- [ ] SVG `background-size: 100% 100%` 위에 HTML 텍스트를 겹칠 때:
  - 텍스트 위치(`padding`, `margin`)도 **`%` 또는 `vw`** 사용
  - 작은 화면 고정값은 기본값으로 유지, `@media (min-width)` 에서만 비례값 적용
- [ ] `preserveAspectRatio="none"` SVG는 의도적 — **변경하지 말 것**

---

## 관련 파일

- `apps/client/src/app/pages/k-digital/k-digital.page.css`
- `apps/client/src/app/pages/k-digital/k-digital.page.html`
- `apps/client/public/images/kd-hero-bg.svg` (수정 금지)
