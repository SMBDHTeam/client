import type { DefaultSession } from "next-auth";

/**
 * NextAuth 기본 타입에 백엔드 연동 값을 더한다.
 *
 * 리프레시 토큰과 만료 시각은 JWT 에만 둔다. Session 에 노출하면 클라이언트
 * 자바스크립트가 읽을 수 있어, 액세스 토큰이 만료돼도 계정을 계속 점유할 수 있다.
 */
declare module "next-auth" {
  interface Session {
    /** 백엔드 API 호출에 쓰는 액세스 토큰. 갱신에 실패하면 없다. */
    accessToken?: string;
    /** 로그인·갱신이 실패한 경우의 사유. 화면이 재로그인을 안내하는 데 쓴다. */
    error?: string;
    user: {
      id?: number;
      nickname?: string;
      profileImageUrl?: string | null;
      /** USER 또는 ADMIN. 관리자 화면 진입 여부를 판단한다. */
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendAccessToken?: string;
    backendRefreshToken?: string;
    /** 액세스 토큰 만료 시각(ms). 이 값으로 미리 갱신할지 판단한다. */
    backendExpiresAt?: number;
    backendUser?: {
      id: number;
      nickname: string;
      profileImageUrl: string | null;
      role: string;
    };
    backendError?: string;
  }
}
