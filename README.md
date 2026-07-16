# Tour Client

부산 여행 일정 생성 클라이언트입니다.

## Schedule V2 mode

일정 생성 V2는 현재 서버의 V1 요청과 섞지 않습니다. 실행 모드는 `NEXT_PUBLIC_SCHEDULE_V2_MODE`로 구분합니다.

- `disabled`: 일정 생성 V2 요청 차단. 프로덕션 기본값입니다.
- `mock`: 목표 계약을 따르는 브라우저 내 계약 시뮬레이터. 개발 기본값입니다.
- `live`: `/api/v1`의 V2 목표 API를 호출합니다. 백엔드 V2 완료 공지 후에만 사용합니다.

필요한 환경 변수는 [.env.example](./.env.example)을 기준으로 설정합니다.

로컬 기본 연결은 Next.js rewrite를 사용합니다. 브라우저는 같은 Origin의 `/api/v1`을 호출하고 Next.js 서버가 `BACKEND_API_URL`로 전달하므로 CORS에 의존하지 않습니다.

```dotenv
NEXT_PUBLIC_SCHEDULE_V2_MODE=live
NEXT_PUBLIC_API_BASE_URL=/api/v1
BACKEND_API_URL=http://localhost:8080
```

브라우저에서 백엔드로 직접 연결해야 하면 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`을 사용할 수 있다. 백엔드는 `localhost:3000`, `127.0.0.1:3000` Origin과 V2 생성의 `Idempotency-Key` 헤더를 허용한다. 개발·운영 배포도 프론트와 API를 같은 Origin의 reverse proxy 아래에 두는 구성을 우선한다.

## Getting Started

```bash
npm ci
npm run dev
```

일정 생성 흐름은 [http://localhost:3000/trips/new/date](http://localhost:3000/trips/new/date)에서 시작합니다.
