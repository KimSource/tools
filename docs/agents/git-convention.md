# Git 커밋 컨벤션

이 저장소의 커밋 제목은 다음 형식을 사용한다.

```text
<type>: <한국어 설명>
```

## 기본 규칙

- `type`은 아래 목록의 영문 소문자를 사용한다.
- 설명은 변경의 목적을 드러내는 간결한 한국어 문장으로 작성한다.
- 설명 끝에 마침표를 붙이지 않는다.
- 한 커밋에는 하나의 논리적인 변경만 담는다.
- 커밋 제목은 가능하면 모호한 표현보다 실제 변경 대상을 포함해 작성한다.
- `scope`는 강제하지 않는다. 변경 범위가 명확할 때만 선택적으로 사용한다.

  ```text
  <type>(<scope>): <한국어 설명>
  ```

## Type

| Type | 용도 |
| --- | --- |
| `feat` | 사용자에게 새로운 기능을 추가할 때 |
| `fix` | 버그나 잘못된 동작을 수정할 때 |
| `refactor` | 동작 변경 없이 구조나 구현을 개선할 때 |
| `test` | 테스트를 추가하거나 수정할 때 |
| `docs` | 문서만 변경할 때 |
| `style` | 동작에 영향이 없는 서식·스타일을 변경할 때 |
| `perf` | 성능을 개선할 때 |
| `build` | 빌드 설정이나 의존성을 변경할 때 |
| `ci` | CI/CD workflow를 변경할 때 |
| `chore` | 위 분류에 해당하지 않는 유지보수 작업을 할 때 |

## 작성 예시

```text
feat: JSON Formatter 도구 목록 추가
feat(json-formatter): JSON 포맷 변환 기능 추가
fix: 잘못된 경로에서 로딩 상태가 남는 문제 수정
test: JSON 변환 core의 중첩 객체 테스트 추가
docs: 초기 구현 계획 링크 정리
build: TypeScript strict 설정 적용
ci: GitHub Pages 배포 workflow 추가
refactor: 도구 로딩 결과 처리 분리
chore: 패키지 버전 업데이트
```

## 본문과 Breaking Change

변경 배경이나 주의할 점을 설명해야 할 때는 제목 다음에 한 줄을 비우고 본문을 작성한다. 제목은 한 줄로 유지한다.

```text
feat: 오프라인 캐시 준비 상태 표시

JSON 도구와 필수 자산의 캐시가 준비된 뒤에만 오프라인 사용 가능 상태를 표시한다.
```

기존 사용 방식이나 공개 계약을 깨는 변경은 본문에 `BREAKING CHANGE:`로 명시한다.

```text
refactor: 도구 Registry 계약 변경

BREAKING CHANGE: Registry 항목에 번역 key를 필수로 요구한다.
```

## 커밋 전 확인

코드나 설정을 변경한 커밋은 프로젝트에 정의된 typecheck, lint, format check, unit test, build 및 관련 E2E를 실행한다. 실행하지 못한 검증은 커밋 또는 PR 설명에 남긴다. 문서만 변경한 경우에는 문서 내용과 링크를 확인한다.
