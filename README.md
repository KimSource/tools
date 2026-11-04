# Local Tools

**입력 데이터는 사용자의 기기 안에서만 처리합니다. 서버로 전송하지 않습니다.**

브라우저에서 사용하는 작은 유틸리티 모음입니다. 현재 JSON Formatter, Base64 인코더·디코더, Hash Generator, URL 인코더·디코더, Unix Timestamp Converter, Color Converter, Random String Generator, Date Calculator, Time Zone Converter, QR Code, Markdown Preview와 Image Editor / Converter를 제공하며, 필요한 도구를 하나씩 추가하고 있습니다.

**[Local Tools 사용하기](https://kimsource.github.io/tools/)** · [JSON Formatter 바로 열기](https://kimsource.github.io/tools/#/json-formatter) · [Base64 바로 열기](https://kimsource.github.io/tools/#/base64) · [Hash Generator 바로 열기](https://kimsource.github.io/tools/#/hash-generator) · [URL 인코더 / 디코더 바로 열기](https://kimsource.github.io/tools/#/url-encoder) · [Unix Timestamp Converter 바로 열기](https://kimsource.github.io/tools/#/unix-timestamp-converter) · [Color Converter 바로 열기](https://kimsource.github.io/tools/#/color-converter) · [Random String Generator 바로 열기](https://kimsource.github.io/tools/#/random-string-generator)

[Date Calculator 바로 열기](https://kimsource.github.io/tools/#/date-calculator) · [Image Editor / Converter 바로 열기](https://kimsource.github.io/tools/#/image-editor-converter)

## 데이터 처리

- JSON 파싱·변환, Base64 인코딩·디코딩, 해시 생성, URL 변환, 시간 변환, 색상 변환, 문자열 생성, 날짜 계산과 이미지 편집·변환은 브라우저 안에서 실행됩니다. 입력과 결과를 서버에 업로드하지 않습니다.
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

### Random String Generator

- 길이 1–256 (기본 16), 개수 1–100 (기본 1)의 문자열 생성 및 전체 복사
- 소문자·대문자·숫자·특수문자를 독립 선택하고 혼동 문자 제외 및 종류별 최소 하나 포함 가능
- 특수문자는 `!@#$%^&*()-_=+[]{};:,.?`, 혼동 문자 제외 목록은 `0`, `1`, `I`, `O`, `l`, `o`
- 브라우저의 암호학적 난수와 기각 표본 추출을 사용해 선택 가능한 결과의 편향을 방지

### Date Calculator

- 날짜 차이의 총 일수와 주·나머지 일수, 방향과 시작일 포함 여부 표시
- 기준 날짜에 년·월·주·일을 더하거나 빼고 결과 복사
- 년과 월을 함께 적용한 후 주와 일을 계산하며, 대상 월에 같은 날짜가 없으면 말일 사용
- UTC를 내부 계산 기준으로 사용해 시간대·서머타임 영향 없이 날짜만 계산

### Time Zone Converter

- 날짜·시간과 기준 시간대를 선택해 여러 대상 시간대로 변환하고 날짜 변경 및 실제 시점의 UTC 오프셋 표시
- 한영 도시·국가명, IANA 식별자와 연간 오프셋으로 시간대 검색; 결과별 및 전체 복사
- 존재하지 않는 현지 시각 안내, 중복 시각의 오프셋 선택
- 도시·국가명은 Unicode CLDR 48.0.0에서 생성하며 [Unicode 라이선스](./src/tools/time-zone-converter/CLDR-LICENSE.txt)를 따름

### QR Code

- 텍스트·URL로 QR 코드를 생성하고 크기를 선택해 PNG·SVG 다운로드
- PNG·JPEG·WebP 이미지를 선택하거나 드래그 앤 드롭해 QR 내용을 읽고 복사
- 읽은 절대 HTTP·HTTPS URL은 사용자가 선택해 새 탭에서 열기
- 모든 생성과 읽기는 기기에서 수행하며 입력과 결과를 저장하지 않음

### Image Editor / Converter

- PNG·JPG·WebP 정지 이미지 한 장을 파일 선택 또는 드래그 앤 드롭으로 입력
- 파일명·실제 포맷·바이트 용량·방향이 반영된 가로×세로·가로세로 비율 표시
- 픽셀 또는 백분율로 크기 변경, 가로세로 비율 유지·확대 허용 선택
- PNG·JPG·WebP 출력, JPG·WebP 품질 0–100 조절, JPG의 투명 영역을 채울 배경색 선택
- **결과 생성** 후 실제 인코딩 결과의 미리보기·용량·원본 대비 증감률 확인 및 다운로드
- 설정을 바꾸면 이전 결과를 지우고 다시 생성하며, 다운로드는 미리보기와 같은 결과 파일을 사용
- 원본 파일을 유지한 채 **원본으로 초기화**로 설정과 결과 초기화; 새 파일은 검증 성공 후 교체
- 기본값: 원본 크기·포맷, 비율 유지 켜짐, 확대 허용 꺼짐, 품질 90%, JPG 배경 흰색
- 입력·설정·결과는 현재 도구 화면의 메모리에만 유지하고 자동 저장·서버 전송하지 않음

### Markdown Preview

- Markdown을 입력하며 표와 코드 하이라이팅을 실시간 미리보기하고 원문을 `.md` 파일로 다운로드
- JavaScript, TypeScript, JSON, HTML/XML, CSS, Bash, Python, SQL 코드 강조
- 원시 HTML은 텍스트로 표시하며 이미지는 자동으로 불러오지 않음
- 절대 HTTP·HTTPS 링크만 사용자가 선택해 새 탭에서 열 수 있음

### 도구 검색과 분류

- 도구 이름·설명·태그와 한영 동의어를 표시 언어와 관계없이 검색
- 검색어의 각 단어와 카테고리를 함께 적용하고 결과가 없으면 조건 초기화 가능
- 검색은 Registry metadata만 사용하며 캐시 준비 후 오프라인에서도 사용 가능

### 공통 기능

- 한국어 / 영어 / 시스템 언어 설정
- 라이트 / 다크 / 시스템 테마 설정
- 캐시 준비 후 Time Zone Converter, JSON Formatter, Base64, Hash Generator, URL 인코더·디코더, Unix Timestamp Converter, Color Converter, Random String Generator, Date Calculator, QR Code, Markdown Preview와 Image Editor / Converter 오프라인 사용 및 도구별 준비 상태 표시
- 새 버전 알림과 업데이트 전 입력 유실 안내

### 오프라인 사용과 업데이트

온라인에서 앱을 열고 각 도구의 **오프라인 사용 가능** 표시를 확인하면, 네트워크를 끊어도 해당 도구에서 지원하는 계산·변환·복사·다운로드를 사용할 수 있습니다. 캐시가 준비되면 아직 열어보지 않은 도구에도 오프라인으로 진입할 수 있습니다. 브라우저의 사이트 데이터를 지우거나 캐시가 제거되면 온라인에서 다시 준비해야 합니다.

새 버전이 준비되면 업데이트 버튼이 표시됩니다. 버튼을 누르면 현재 입력이 사라질 수 있다는 안내를 보여주며, 취소하면 작업을 계속할 수 있습니다. 업데이트를 수락하면 새 버전으로 자동 갱신합니다. 보관할 입력이나 결과는 갱신 전에 복사하거나 다운로드해 두세요.

### 현재 제한

- Image Editor / Converter는 파일당 최대 **10 MiB (10 × 1024 × 1024 바이트)**, **1,600만 픽셀**, **가로·세로 각각 1–8,192px**의 정지 이미지를 지원하며 출력에도 같은 픽셀 제한을 적용합니다. 크기·애니메이션 여부를 파일 내용에서 먼저 검사하고 브라우저 디코딩 후 크기를 재확인합니다. APNG(단일 프레임 컨테이너 포함)·애니메이션 WebP·GIF는 거부하며 첫 프레임 추출도 제공하지 않습니다.
- 이미지 방향은 브라우저의 `createImageBitmap` 디코딩을 따릅니다. EXIF·ICC 등 원본 메타데이터 보존, 정확한 색상 재현, 동일 품질 값의 브라우저 간 동일 결과는 보장하지 않습니다. 브라우저에서 지원하지 않는 출력은 선택할 수 없으며 실제 MIME·시그니처가 요청 포맷과 다르면 다운로드를 제공하지 않습니다. PNG는 품질 조절이나 전용 무손실 최적화를 제공하지 않습니다. 결과 용량이 원본보다 커질 수도 있습니다.
- 이미지 처리는 메인 스레드에서 수행합니다. 1,600만 픽셀 RGBA 버퍼 하나가 약 64 MB이며 원본·Canvas·결과 미리보기·인코더가 함께 메모리를 사용하므로 제한 안에서도 기기 메모리와 브라우저 Canvas 한계에 따라 실패할 수 있습니다. 원본 미리보기는 최대 1,024px 축소본을 사용하고 작업 종료·교체·화면 이탈 시 임시 자원을 정리합니다. 자르기·회전·애니메이션 보존·EXIF 상세 정보·일괄 처리는 후속 단계입니다.

- Time Zone Converter의 시간대 규칙은 브라우저의 Intl 데이터에 따르므로 브라우저 버전마다 결과가 다를 수 있습니다. 목록의 연간 오프셋은 매일 표본 조사하므로 하루보다 짧은 과거 구간은 누락될 수 있습니다. 변환 결과는 실제 시점의 오프셋을 표시합니다. 브라우저가 지원하지 않는 시간대는 제외합니다. 일부 대표 지역명은 도시가 아닌 국가·지역 이름입니다.

- Markdown Preview는 원시 HTML을 렌더링하지 않고 이미지를 대체 텍스트로 표시합니다. 상대 링크와 HTTP·HTTPS 외의 링크는 열 수 없습니다. 지원하지 않는 코드 언어는 일반 텍스트로 표시합니다. 링크를 열면 해당 사이트에 접속합니다.

- QR Code 읽기는 한 번에 한 장의 PNG·JPEG·WebP 이미지(최대 10 MB, 1600만 픽셀)와 한 개의 QR 결과를 지원합니다. 이미지 품질에 따라 읽기에 실패할 수 있으며 애니메이션은 지원하지 않습니다. QR 생성 용량은 입력과 문자 구성에 따라 달라집니다. 카메라 스캔과 전용 입력 양식은 제공하지 않습니다.

- Date Calculator는 그레고리력 `0001-01-01`–`9999-12-31`의 날짜만 지원하며 영업일·공휴일은 고려하지 않습니다. 단위별 입력은 0–9999 정수입니다. 월말 조정 때문에 반대 연산이 원래 날짜를 복원하지 않을 수 있습니다.
- 검색은 공백으로 나눈 모든 단어가 이름·설명·태그·키워드 중 하나에 포함되어야 합니다. 태그 선택 필터는 제공하지 않습니다.
- JSON Formatter는 `JSON.parse`와 `JSON.stringify`를 사용하므로 원문을 완전히 보존하지 않습니다. 큰 정수의 정밀도가 손실되거나 중복 키가 제거될 수 있습니다.
- Base64는 UTF-8 텍스트와 표준 Base64만 지원합니다. 바이너리 파일과 Base64URL은 지원하지 않으며, 디코딩 시 필요한 `=` 패딩을 생략할 수 없습니다.
- URL 구성 요소 변환은 전체 URL이 아닌 개별 구성 요소를 대상으로 합니다. 쿼리 분해에서는 값이 없는 키와 빈 값을 같은 빈 문자열로 표시합니다.
- Unix 타임스탬프 자동 감지는 부호를 제외한 10자리 정수는 초, 13자리 정수는 밀리초로 해석하며 그 외에는 수동 선택이 필요합니다. 초는 밀리초 정밀도까지, 밀리초는 정수만 지원합니다. 날짜 입력은 네 자리 연도와 `Z` 또는 명시적 오프셋이 있는 ISO 8601 형식만 지원하며, JavaScript Date의 범위로 제한됩니다.
- Color Converter는 `#RGB`, `#RRGGBB`, 정수 `rgb(r, g, b)` (각 0–255), `hsl(h, s%, l%)` (색조 0–360, 채도·명도 0–100)을 지원합니다. HSL은 소수점 둘째 자리까지 입력할 수 있습니다. 알파 채널·색상 이름·다른 CSS 표기는 지원하지 않습니다. HSL에서 RGB로 변환할 때 8비트 채널을 가장 가까운 정수로 반올림하며, HSL 결과는 그 RGB에서 다시 계산해 소수점 둘째 자리까지 표시하므로 입력과 조금 달라질 수 있습니다.
- Random String Generator의 보안 강도는 선택한 길이와 문자 집합에 따라 달라지며 결과는 중복될 수 있습니다. 필수 포함 옵션은 길이가 선택한 종류 수 이상이어야 합니다. 복사에는 클립보드를 지원하는 보안 환경이 필요합니다.
- 변환은 메인 스레드에서 실행합니다. 매우 큰 입력은 화면 반응을 느리게 할 수 있습니다.
- 자동화된 브라우저 검증은 데스크톱 Chromium을 기준으로 합니다. 이미지 편집기를 포함한 일부 도구는 모바일 뷰포트·키보드 흐름을 자동 검증하지만, 실제 모바일 기기와 다른 브라우저의 동작은 추가 검증이 필요합니다.

## 개발 우선순위

- 당분간 새로운 도구 추가를 우선합니다.
- 도구를 추가할 때마다 이 문서의 도구 목록·기능·제한·검증 범위를 함께 갱신합니다.
- 모바일 레이아웃·키보드 접근성·다른 브라우저에 대한 추가 검증은 후속 작업으로 미룹니다.

## 추가 개발 계획

구현 순서는 미정이며, 세부 요구사항과 구현 방침은 [로드맵](./docs/roadmap.md)에 정리합니다.

- Image Editor / Converter 후속 단계: 자르기·회전, 애니메이션 보존·편집·변환과 PNG 무손실 최적화·EXIF 상세 정보·일괄 처리 검토

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

| 명령                 | 검증 범위                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`           | 이미지 파일 헤더·애니메이션 판별·크기·비율·반올림·확대 제한·출력 MIME 및 시그니처·품질·배경색·용량 증감 계산, Markdown 렌더링·코드 강조·HTML 및 URL 처리, QR Unicode 디코딩·URL 판별·빈 입력, Time Zone Converter의 누락·중복 시각, 변환 및 연간 오프셋, Date Calculator의 차이·포함·역순·월말·윤년·복합 단위·경계·오류·시간대 독립성, JSON core의 값 종류·오류·Unicode 처리, Base64 core의 UTF-8 왕복 변환·공백·오류 처리, Hash Generator의 알고리즘·UTF-8 처리, URL 변환·쿼리 분해·오류 처리, Unix 타임스탬프 단위 감지·변환·날짜 유효성, 색상 변환·경계·오류·왕복, 랜덤 문자열 집합·경계·필수 포함·난수 선택, 도구 검색·분류, Hash Router |
| `npm run e2e`        | 이미지 파일 선택·드롭·세 포맷 변환·다운로드 내용·투명도·JPG 배경색·EXIF 방향·오류·초기화·미지원 출력·모바일·키보드·언어·테마·URL 정리, Markdown 입력·미리보기·보안·다운로드·모바일, QR 생성·다운로드·이미지 읽기·복사·드롭·검색, Time Zone Converter의 검색·서머타임·복사·키보드·모바일, Date Calculator의 두 모드·오류·복사·검색, 개발 서버에서 JSON 변환·상태 초기화·오류 복구·로딩·설정 유지 및 Base64 UTF-8 인코딩·디코딩 및 Hash Generator 생성·복사 및 URL 변환·쿼리 분해·복사 및 Unix 타임스탬프 양방향 변환·오류·복사·현재 시간 및 색상 변환·피커·복사·오류 및 랜덤 문자열 생성·옵션·오류·복사 및 도구 검색·필터·초기화              |
| `npm run e2e:smoke`  | production build의 앱 진입과 JSON 변환                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `npm run e2e:pwa`    | 이미지 편집기 오프라인 첫 진입·새로고침·파일 입력·크기 및 포맷 변환·다운로드, Markdown 오프라인 첫 진입·미리보기·다운로드, QR 오프라인 첫 진입·생성·읽기, JSON Formatter의 캐시 준비 표시·현재 자산 누락 시 이전 캐시 제외·오프라인 첫 진입·새로고침·복사·다운로드 내용 및 Hash Generator, URL 도구와 Unix Timestamp Converter와 Color Converter와 Random String Generator와 Date Calculator와 Time Zone Converter 오프라인 첫 진입 및 오프라인 검색·필터                                                                                                                                                                                    |
| `npm run e2e:update` | A/B 빌드 간 업데이트 취소·재열기·수락, 자동 갱신 및 B 버전 오프라인 변환                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `npm run e2e:pages`  | 실제 Pages 배포의 manifest scope와 오프라인 JSON 변환                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

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

### 시간대 지명 데이터 갱신

`src/tools/time-zone-converter/time-zones.json`은 Unicode CLDR 48.0.0의 `cldr-dates-full` 한영 `timeZoneNames.json`, `cldr-localenames-full` 한영 `territories.json`, `cldr-bcp47`의 `timezone.json`을 사용합니다. 각 파일을 각각 `tools-cldr-ko.json`, `tools-cldr-en.json`, `tools-territories-ko.json`, `tools-territories-en.json`, `tools-cldr-zones.json`으로 한 디렉터리에 준비한 뒤 `node scripts/generate-time-zones.mjs <디렉터리>`를 실행합니다. 갱신 시 버전·라이선스와 별칭·지역명 누락, 브라우저 지원 및 번들 크기를 재검토합니다. 시간대 변환 규칙은 이 데이터가 아닌 브라우저 Intl을 사용합니다.
