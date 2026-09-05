# Local Tools

**입력 데이터는 사용자의 기기 안에서만 처리합니다. 서버로 전송하지 않습니다.**

브라우저에서 사용하는 작은 유틸리티 모음입니다. 현재 JSON Formatter를 제공하며, 필요한 도구를 하나씩 추가하고 있습니다.

**[Local Tools 사용하기](https://kimsource.github.io/tools/)** · [JSON Formatter 바로 열기](https://kimsource.github.io/tools/#/json-formatter)

## 데이터 처리

- JSON 파싱과 변환은 브라우저 안에서 실행됩니다. 입력과 결과를 서버에 업로드하지 않습니다.
- 입력과 결과는 자동으로 영구 저장하지 않습니다. 새로고침하거나 도구 화면을 떠나면 사라질 수 있습니다.
- 복사와 다운로드는 사용자가 버튼을 눌렀을 때만 실행됩니다.
- 언어와 테마 설정만 브라우저의 `localStorage`에 저장합니다.
- 앱 파일을 내려받거나 업데이트할 때는 네트워크를 사용합니다. PWA 캐시는 앱 자산을 저장하며, JSON 입력을 저장하는 용도가 아닙니다.

## 현재 기능

- JSON Format / Minify
- 들여쓰기 2칸 / 4칸
- 결과 복사 및 JSON 파일 다운로드
- 빈 입력과 잘못된 JSON 안내
- 한국어 / 영어 / 시스템 언어 설정
- 라이트 / 다크 / 시스템 테마 설정
- PWA 기본 구성 및 새 버전 업데이트 버튼

### 현재 제한

- `JSON.parse`와 `JSON.stringify`를 사용하므로 원문을 완전히 보존하지 않습니다. 큰 정수의 정밀도가 손실되거나 중복 키가 제거될 수 있습니다.
- 변환은 메인 스레드에서 실행합니다. 매우 큰 JSON은 화면 반응을 느리게 할 수 있습니다.
- 오프라인 캐시와 업데이트 알림은 구현되어 있으나, production build 기반의 오프라인·업데이트 검증은 진행 중입니다.
- 현재 업데이트 버튼은 바로 갱신을 요청합니다. 입력을 보관해야 한다면 갱신 전에 별도로 복사해 두세요.

## 로컬 개발

Node.js 24와 npm을 사용합니다. Node 버전은 [.nvmrc](./.nvmrc)에 지정되어 있습니다.

```sh
npm ci
npm run dev
```

터미널에 표시되는 개발 서버 주소의 `/tools/` 경로를 엽니다. 기본 포트에서는 `http://localhost:5173/tools/`입니다.

### 검증

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npx playwright install chromium
npm run e2e
npm run build
```

Linux에서 브라우저 시스템 의존성도 설치하려면 `npx playwright install --with-deps chromium`을 사용합니다.

현재 E2E는 개발 서버의 데스크톱 Chromium에서 JSON 변환, 오류 복구, 언어·테마 변경을 확인합니다. Service Worker와 오프라인 검증을 포함하지는 않습니다.

### 빌드 결과 확인

```sh
npm run build
npm run preview
```

터미널에 표시되는 preview 주소의 `/tools/` 경로를 엽니다. 빌드 산출물은 `dist/`에 생성됩니다.

## 기술 구성

- Vite + Lit + TypeScript strict
- Web Awesome UI primitives와 자체 CSS design tokens
- Registry 기반 도구 lazy loading 및 UI와 core 로직 분리
- Vitest / Playwright
- vite-plugin-pwa / GitHub Pages / Hash routing

## 배포

[GitHub Actions workflow](./.github/workflows/ci-pages.yml)는 PR과 `main` push에서 타입·린트·서식·단위 테스트·브라우저 테스트·빌드를 검증합니다. `main` push에서는 검증을 통과한 `dist/`를 GitHub Pages에 배포합니다.

저장소의 **Settings → Pages → Source**는 **GitHub Actions**로 설정합니다. 앱의 base, manifest scope와 start URL은 `/tools/`를 기준으로 합니다.

## 라이선스

이 프로젝트의 자체 코드는 [Zero-Clause BSD (0BSD)](./LICENSE)로 제공합니다. 상업적 사용, 수정, 재배포가 가능하며 저작권·라이선스 고지 유지 의무가 없습니다. 소프트웨어는 보증 없이 제공됩니다.

외부 라이브러리와 자산에는 각각의 라이선스가 적용됩니다. 프로젝트의 0BSD 라이선스가 해당 조건을 대체하지 않습니다.
