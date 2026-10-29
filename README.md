# JASMINE PARK portfolio

JASMINE PARK의 인터랙티브 개인 포트폴리오입니다. 흰 배경의 3D 눈, 연도별 작업 목록, 동공 안의 구형 공간을 중심으로 구성했습니다.

- 사이트: https://optinomai.vercel.app/
- GitHub Pages: https://cornsrfab.github.io/optinomai/
- 저장소: https://github.com/cornsrfab/optinomai
- 작업 인계와 디자인 결정: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- 다음 작업자를 위한 안내: [AGENTS.md](AGENTS.md)

## 실행

별도 설치나 빌드가 없는 HTML, CSS, JavaScript 사이트입니다. 저장소를 내려받아 루트의 `index.html`을 브라우저로 열면 됩니다. 개발 시에는 저장소 루트를 정적 HTTP 서버로 제공해 확인할 수 있습니다.

| 파일 | 역할 |
| --- | --- |
| `index.html` | J 모노그램, 연도별 작업 목록, 연락처, 이미지 뷰어 |
| `style.css` | 레이아웃, 글꼴, 표시자 그래픽, 반응형 스타일 |
| `app.js` | 눈의 투영과 회전, 스크롤, 이미지 선택, 카테고리 목록 |
| `void.js` | 동공 미리보기와 내부 천구(실제 별, 천체사진, 실시간 달·토성) |
| `sky-data.js` | 별(5.5등급까지)과 별자리 선 데이터 |
| `vendor/` | 달·토성 위치 계산 라이브러리(Astronomy Engine) |
| `images/astro/` | 천구용 흰색 마스크와 `full/` 원본 사진 |

실제 작업 사진은 아직 연결되지 않았습니다. 현재 회색 이미지는 코드로 만든 그라데이션이며 작업명과 연도 배치도 임시입니다. 이미지 파일만 업로드해도 자동 표시되는 구조는 아닙니다. 자세한 교체 방법은 작업 인계 문서를 읽어주세요.

## 다른 컴퓨터나 새 채팅에서 이어가기

이 저장소를 연결하거나 내려받고 아래와 같이 요청하세요.

> AGENTS.md와 docs/PROJECT_CONTEXT.md를 먼저 읽고, 현재 소스를 확인한 뒤 JASMINE PARK 포트폴리오 작업을 이어가줘.

대화 전체를 가져오지 않아도 문서와 소스로 작업을 이어갈 수 있습니다.
