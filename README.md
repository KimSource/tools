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
- 캐시 준비 후 JSON Formatter 오프라인 사용 및 준비 상태 표시
- 새 버전 알림과 업데이트 전 입력 유실 안내

### 오프라인 사용과 업데이트

온라인에서 앱을 열고 도구의 **오프라인 사용 가능** 표시를 확인하면, 네트워크를 끊어도 JSON 변환·복사·다운로드를 사용할 수 있습니다. 캐시가 준비되면 아직 열어보지 않은 JSON Formatter에도 오프라인으로 진입할 수 있습니다. 브라우저의 사이트 데이터를 지우거나 캐시가 제거되면 온라인에서 다시 준비해야 합니다.

새 버전이 준비되면 업데이트 버튼이 표시됩니다. 버튼을 누르면 현재 입력이 사라질 수 있다는 안내를 보여주며, 취소하면 작업을 계속할 수 있습니다. 업데이트를 수락하면 새 버전으로 자동 갱신합니다. 보관할 입력이나 결과는 갱신 전에 복사하거나 다운로드해 두세요.

### 현재 제한

- `JSON.parse`와 `JSON.stringify`를 사용하므로 원문을 완전히 보존하지 않습니다. 큰 정수의 정밀도가 손실되거나 중복 키가 제거될 수 있습니다.
- 변환은 메인 스레드에서 실행합니다. 매우 큰 JSON은 화면 반응을 느리게 할 수 있습니다.
- 자동화된 브라우저 검증은 데스크톱 Chromium을 기준으로 합니다. 모바일 레이아웃·키보드 접근성 및 다른 브라우저의 동작은 추가 검증이 필요합니다.

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
npm run e2e:smoke
npm run e2e:pwa
```

Linux에서 브라우저 시스템 의존성도 설치하려면 `npx playwright install --with-deps chromium`을 사용합니다.

| 명령                 | 검증 범위                                                                |
| -------------------- | ------------------------------------------------------------------------ |
| `npm test`           | JSON core의 값 종류·오류·Unicode 처리와 Hash Router                      |
| `npm run e2e`        | 개발 서버에서 변환·상태 초기화·오류 복구·로딩·설정 유지                  |
| `npm run e2e:smoke`  | production build의 앱 진입과 JSON 변환                                   |
| `npm run e2e:pwa`    | 캐시 준비 표시, 오프라인 첫 진입·새로고침·복사·다운로드 내용             |
| `npm run e2e:update` | A/B 빌드 간 업데이트 취소·재열기·수락, 자동 갱신 및 B 버전 오프라인 변환 |
| `npm run e2e:pages`  | 실제 Pages 배포의 manifest scope와 오프라인 JSON 변환                    |

`e2e:smoke`와 `e2e:pwa`는 먼저 `npm run build`를 실행해야 합니다. 개발 서버 테스트는 3000, production 테스트는 3001, A/B 업데이트 테스트는 3002 포트를 사용합니다.

업데이트와 실제 배포는 별도로 검증할 수 있습니다.

```sh
npm run e2e:update
npm run e2e:pages
```

`e2e:update`는 A/B 빌드를 만들고 `.tmp/pwa-update/`에 테스트 자산을 생성하며 `dist/`도 덮어씁니다. 배포나 일반 preview 전에는 `npm run build`를 다시 실행하세요. `e2e:pages`는 로컬 변경이 아닌 실제 배포본을 대상으로 하며 네트워크 연결이 필요합니다.

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

[GitHub Actions workflow](./.github/workflows/ci-pages.yml)는 PR과 `main` push에서 타입·린트·서식·단위 테스트·개발 서버 E2E·빌드·production smoke·PWA 테스트를 검증합니다. `main` push에서는 검증을 통과한 `dist/`를 GitHub Pages에 배포합니다. A/B 업데이트와 실제 Pages 테스트는 현재 CI에 포함되지 않습니다.

저장소의 **Settings → Pages → Source**는 **GitHub Actions**로 설정합니다. 앱의 base, manifest scope와 start URL은 `/tools/`를 기준으로 합니다.

## 라이선스

이 프로젝트의 자체 코드는 [Zero-Clause BSD (0BSD)](./LICENSE)로 제공합니다. 상업적 사용, 수정, 재배포가 가능하며 저작권·라이선스 고지 유지 의무가 없습니다. 소프트웨어는 보증 없이 제공됩니다.

외부 라이브러리와 자산에는 각각의 라이선스가 적용됩니다. 프로젝트의 0BSD 라이선스가 해당 조건을 대체하지 않습니다.
