# 프로젝트 규칙

- Vite + Lit + TypeScript strict를 사용한다. Web Awesome은 UI primitives에만 사용한다.
- 도구는 Registry를 통해 lazy-load·렌더링하며, 다른 도구를 직접 import하지 않는다. 계산·변환 로직은 UI와 분리한다.
- Registry를 도구 metadata의 단일 진실 공급원으로 유지하고, 목록·검색·카테고리·라우팅·오프라인 기능은 여기서 파생한다. Tool ID·route·저장 key는 언어와 무관한 안정적인 식별자를 사용한다.
- 사용자 데이터는 기기 안에서 처리하며, 서버 전송이나 자동 영구 저장을 추가하지 않는다.
- 도구 UI의 저장소·파일·클립보드 접근은 공통 서비스를 통한다. 실제로 필요한 서비스만 만든다.
- UI 문자열은 타입이 지정된 ko/en i18n key로 관리하고, 자체 design tokens와 라이트/다크·모바일·키보드 접근성을 유지한다.
- GitHub Pages `/tools/` base·scope와 hash routing을 유지한다. 기본 도구는 캐시 준비 후 오프라인에서 동작해야 한다.
- 무거운 의존성·WASM·모델을 Shell이나 기본 precache에 넣지 않는다. 의존성·추상화는 현재 기능에 필요할 때만 추가한다.
- 브라우저 표준 API와 순수 TypeScript를 우선하며, 측정되거나 검증된 필요가 있을 때만 Web Worker, WASM, Offline Pack 순서로 복잡도를 높인다. 새 런타임 의존성은 도입 이유와 초기 bundle·precache 영향을 확인한다.
- 코드 변경 시 core 동작은 Vitest로, 주요 브라우저 흐름은 Playwright로 검증한다. PWA 변경은 build 후 `e2e:pwa`, 업데이트 변경은 `e2e:update`로 확인한다. 명령·검증 범위는 `README.md`를 참고한다.
- 코드·설정 변경 후 프로젝트에 정의된 typecheck, lint, format check, unit test, build 및 관련 E2E를 실행하고, 실행하지 못한 검증은 명시한다. 문서만 변경했다면 내용·링크를 확인한다.
- `e2e:update`는 `dist/`를 테스트 빌드로 덮어쓴다. 이후 배포·일반 preview 전에는 다시 build한다.
- 커밋 시 `docs/agents/git-convention.md`를 따른다.
