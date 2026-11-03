# Local Tools

**입력 데이터는 사용자의 기기 안에서만 처리합니다. 서버로 전송하지 않습니다.**

브라우저에서 사용하는 작은 유틸리티 모음입니다. 현재 JSON Formatter, Base64 인코더·디코더, Hash Generator, URL 인코더·디코더, Unix Timestamp Converter와 Color Converter를 제공하며, 필요한 도구를 하나씩 추가하고 있습니다.

**[Local Tools 사용하기](https://kimsource.github.io/tools/)** · [JSON Formatter 바로 열기](https://kimsource.github.io/tools/#/json-formatter) · [Base64 바로 열기](https://kimsource.github.io/tools/#/base64) · [Hash Generator 바로 열기](https://kimsource.github.io/tools/#/hash-generator) · [URL 인코더 / 디코더 바로 열기](https://kimsource.github.io/tools/#/url-encoder) · [Unix Timestamp Converter 바로 열기](https://kimsource.github.io/tools/#/unix-timestamp-converter) · [Color Converter 바로 열기](https://kimsource.github.io/tools/#/color-converter)

## 데이터 처리

- JSON 파싱·변환, Base64 인코딩·디코딩, 해시 생성, URL 변환, 시간 변환과 색상 변환은 브라우저 안에서 실행됩니다. 입력과 결과를 서버에 업로드하지 않습니다.
- 입력과 결과는 자동으로 영구 저장하지 않습니다. 새로고침하거나 도구 화면을 떠나면 사라질 수 있습니다.
- 복사와 다운로드는 사용자가 버튼을 눌렀을 때만 실행됩니다.
- 언어와 테마 설정만 브라우저의 `localStorage`에 저장합니다.
- 앱 파일을 내려받거나 업데이트할 때는 네트워크를 사용합니다. PWA 캐시는 앱 자산을 저장하며, 도구의 입력과 결과를 저장하는 용도가 아닙니다.

## 현재 기능

### JSON Formatter

- JSON Format / Minify
- 들여쓰기 2칸 / 4칸
- 결과 복사 및 JSON 파일 다운로드
- 빈 입력과 잘못된 JSON 안내

### Base64 인코더·디코더

- 한글·이모지를 포함한 UTF-8 텍스트 인코딩·디코딩
- 디코딩 시 공백·탭·줄바꿈 허용
- 입력 문자 수·UTF-8 바이트 수 및 결과 문자 수 표시
- 결과 복사 및 텍스트 파일 다운로드 (`encoded.txt` / `decoded.txt`)
- 빈 입력과 잘못된 Base64 또는 UTF-8 안내

### Hash Generator

- UTF-8 텍스트의 SHA-256·SHA-384·SHA-512 해시 생성 및 HEX 결과 복사
- 공백·줄바꿈과 빈 텍스트를 그대로 처리
- 브라우저 Web Crypto API 사용 (HTTPS 또는 localhost 필요)

### URL 인코더 / 디코더

- URL 구성 요소 인코딩·디코딩 및 잘못된 퍼센트 인코딩·UTF-8 안내
- 전체 URL 또는 쿼리 문자열의 파라미터를 순서와 중복 키를 유지하는 JSON 배열로 분해
- 쿼리의 `+`는 공백으로 해석하며 구성 요소 디코딩에서는 그대로 유지
- 변환 결과 복사

### Unix Timestamp Converter

- Unix 타임스탬프와 시간대가 명시된 ISO 8601 날짜를 양방향 변환
- 초·밀리초 자동 감지 또는 수동 선택, 현재 시간 넣기
- 초·밀리초, UTC·로컬 시간·ISO 8601 결과 표시 및 각각 복사
- 자동 감지가 모호하거나 입력이 유효하지 않으면 안내

### Color Converter

- HEX·RGB·HSL 양방향 변환과 컬러 피커·미리보기
- 형식별 결과 복사, 잘못된 입력과 범위 초과 안내
- HSL은 8비트 RGB로 반올림한 색상을 기준으로 표시

### 도구 검색과 분류

- 도구 이름·설명·태그와 한영 동의어를 표시 언어와 관계없이 검색
- 검색어의 각 단어와 카테고리를 함께 적용하고 결과가 없으면 조건 초기화 가능
- 검색은 Registry metadata만 사용하며 캐시 준비 후 오프라인에서도 사용 가능

### 공통 기능

- 한국어 / 영어 / 시스템 언어 설정
- 라이트 / 다크 / 시스템 테마 설정
- 캐시 준비 후 JSON Formatter, Base64, Hash Generator, URL 인코더·디코더, Unix Timestamp Converter와 Color Converter 오프라인 사용 및 도구별 준비 상태 표시
- 새 버전 알림과 업데이트 전 입력 유실 안내

### 오프라인 사용과 업데이트

온라인에서 앱을 열고 각 도구의 **오프라인 사용 가능** 표시를 확인하면, 네트워크를 끊어도 해당 도구에서 지원하는 계산·변환·복사·다운로드를 사용할 수 있습니다. 캐시가 준비되면 아직 열어보지 않은 도구에도 오프라인으로 진입할 수 있습니다. 브라우저의 사이트 데이터를 지우거나 캐시가 제거되면 온라인에서 다시 준비해야 합니다.

새 버전이 준비되면 업데이트 버튼이 표시됩니다. 버튼을 누르면 현재 입력이 사라질 수 있다는 안내를 보여주며, 취소하면 작업을 계속할 수 있습니다. 업데이트를 수락하면 새 버전으로 자동 갱신합니다. 보관할 입력이나 결과는 갱신 전에 복사하거나 다운로드해 두세요.

### 현재 제한

- 검색은 공백으로 나눈 모든 단어가 이름·설명·태그·키워드 중 하나에 포함되어야 합니다. 태그 선택 필터는 제공하지 않습니다.
- JSON Formatter는 `JSON.parse`와 `JSON.stringify`를 사용하므로 원문을 완전히 보존하지 않습니다. 큰 정수의 정밀도가 손실되거나 중복 키가 제거될 수 있습니다.
- Base64는 UTF-8 텍스트와 표준 Base64만 지원합니다. 바이너리 파일과 Base64URL은 지원하지 않으며, 디코딩 시 필요한 `=` 패딩을 생략할 수 없습니다.
- URL 구성 요소 변환은 전체 URL이 아닌 개별 구성 요소를 대상으로 합니다. 쿼리 분해에서는 값이 없는 키와 빈 값을 같은 빈 문자열로 표시합니다.
- Unix 타임스탬프 자동 감지는 부호를 제외한 10자리 정수는 초, 13자리 정수는 밀리초로 해석하며 그 외에는 수동 선택이 필요합니다. 초는 밀리초 정밀도까지, 밀리초는 정수만 지원합니다. 날짜 입력은 네 자리 연도와 `Z` 또는 명시적 오프셋이 있는 ISO 8601 형식만 지원하며, JavaScript Date의 범위로 제한됩니다.
- Color Converter는 `#RGB`, `#RRGGBB`, 정수 `rgb(r, g, b)` (각 0–255), `hsl(h, s%, l%)` (색조 0–360, 채도·명도 0–100)을 지원합니다. HSL은 소수점 둘째 자리까지 입력할 수 있습니다. 알파 채널·색상 이름·다른 CSS 표기는 지원하지 않습니다. HSL에서 RGB로 변환할 때 8비트 채널을 가장 가까운 정수로 반올림하며, HSL 결과는 그 RGB에서 다시 계산해 소수점 둘째 자리까지 표시하므로 입력과 조금 달라질 수 있습니다.
- 변환은 메인 스레드에서 실행합니다. 매우 큰 입력은 화면 반응을 느리게 할 수 있습니다.
- 자동화된 브라우저 검증은 데스크톱 Chromium을 기준으로 합니다. 모바일 레이아웃·키보드 접근성 및 다른 브라우저의 동작은 추가 검증이 필요합니다.

## 개발 우선순위

- 당분간 새로운 도구 추가를 우선합니다.
- 도구를 추가할 때마다 이 문서의 도구 목록·기능·제한·검증 범위를 함께 갱신합니다.
- 모바일 레이아웃·키보드 접근성·다른 브라우저에 대한 추가 검증은 후속 작업으로 미룹니다.

## 추가 예정 도구

구현 순서는 미정이며, 세부 요구사항과 구현 방침은 [로드맵](./docs/roadmap.md)에 정리합니다.

- Markdown Preview: 표·코드 하이라이팅을 지원하는 미리보기
- Random String Generator: 문자 종류·길이·개수를 지정하는 랜덤 문자열 생성
- Date Calculator: 날짜 차이와 년·월·주·일 더하기·빼기
- Time Zone Converter: 시간대 검색과 서머타임을 반영한 여러 지역 시간 변환
- QR Code: 텍스트·URL로 생성하고 이미지에서 읽기
- Image Editor / Converter: 크기 변경·압축·포맷 변환·자르기·회전·정보 확인

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

| 명령                 | 검증 범위                                                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`           | JSON core의 값 종류·오류·Unicode 처리, Base64 core의 UTF-8 왕복 변환·공백·오류 처리, Hash Generator의 알고리즘·UTF-8 처리, URL 변환·쿼리 분해·오류 처리, Unix 타임스탬프 단위 감지·변환·날짜 유효성, 색상 변환·경계·오류·왕복, 도구 검색·분류, Hash Router |
| `npm run e2e`        | 개발 서버에서 JSON 변환·상태 초기화·오류 복구·로딩·설정 유지 및 Base64 UTF-8 인코딩·디코딩 및 Hash Generator 생성·복사 및 URL 변환·쿼리 분해·복사 및 Unix 타임스탬프 양방향 변환·오류·복사·현재 시간 및 색상 변환·피커·복사·오류 및 도구 검색·필터·초기화  |
| `npm run e2e:smoke`  | production build의 앱 진입과 JSON 변환                                                                                                                                                                                                                     |
| `npm run e2e:pwa`    | JSON Formatter의 캐시 준비 표시·현재 자산 누락 시 이전 캐시 제외·오프라인 첫 진입·새로고침·복사·다운로드 내용 및 Hash Generator, URL 도구와 Unix Timestamp Converter와 Color Converter 오프라인 첫 진입 및 오프라인 검색·필터                              |
| `npm run e2e:update` | A/B 빌드 간 업데이트 취소·재열기·수락, 자동 갱신 및 B 버전 오프라인 변환                                                                                                                                                                                   |
| `npm run e2e:pages`  | 실제 Pages 배포의 manifest scope와 오프라인 JSON 변환                                                                                                                                                                                                      |

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
