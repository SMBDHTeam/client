import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

/**
 * 백엔드 로그인 연동.
 *
 * 구글 로그인 자체는 NextAuth 가 처리하지만 우리 서버는 그 결과를 모른다. 구글이 준
 * id_token 을 백엔드에 넘겨 서버 토큰을 받아 세션에 실어 둔다.
 *
 * 백엔드 액세스 토큰은 30분이고 NextAuth 세션은 기본 30일이다. 갱신하지 않으면 화면은
 * 로그인 상태인데 백엔드 호출만 401 이 되는 상태로 조용히 넘어간다. 만료가 가까우면
 * 여기서 갱신한다.
 */

const BACKEND = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/** 만료 이 시간 전부터 미리 갱신한다. 요청을 처리하는 중에 만료되는 것을 막는다. */
const REFRESH_MARGIN_MS = 60 * 1000;

type BackendTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    nickname: string;
    profileImageUrl: string | null;
    role: string;
  };
};

function applyTokens(token: JWT, issued: BackendTokens): JWT {
  return {
    ...token,
    backendAccessToken: issued.accessToken,
    backendRefreshToken: issued.refreshToken,
    backendExpiresAt: Date.now() + issued.expiresIn * 1000,
    backendUser: issued.user,
    backendError: undefined,
  };
}

async function exchangeGoogleToken(idToken: string): Promise<BackendTokens | null> {
  const response = await fetch(`${BACKEND}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    console.error("[auth] backend login failed", response.status, await response.text());
    return null;
  }
  return (await response.json()) as BackendTokens;
}

/**
 * 리프레시 토큰은 쓸 때마다 새 값으로 바뀐다. 응답의 refreshToken 을 반드시 보관해야
 * 하며, 이전 값을 다시 보내면 서버가 탈취로 보고 그 사용자의 모든 기기 로그인을 끊는다.
 */
async function refreshBackendToken(token: JWT): Promise<JWT> {
  const refreshToken = token.backendRefreshToken;
  if (!refreshToken) {
    return { ...token, backendError: "NoRefreshToken" };
  }

  try {
    const response = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // 만료됐거나 이미 쓴 토큰이다. 되살릴 수 없으므로 다시 로그인해야 한다.
      // 액세스 토큰을 지워 화면이 로그인 상태로 남지 않게 한다.
      console.error("[auth] backend refresh failed", response.status);
      return {
        ...token,
        backendAccessToken: undefined,
        backendRefreshToken: undefined,
        backendError: "RefreshFailed",
      };
    }
    return applyTokens(token, (await response.json()) as BackendTokens);
  } catch (error) {
    // 네트워크 오류는 일시적일 수 있다. 토큰을 버리지 않고 다음 요청에서 다시 시도한다.
    // 여기서 지우면 잠깐 끊긴 것만으로 로그아웃된다.
    console.error("[auth] backend refresh error", error);
    return token;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // account 는 최초 로그인에만 채워지며 id_token 도 이때만 온다.
      if (account?.id_token) {
        const issued = await exchangeGoogleToken(account.id_token);
        return issued
          ? applyTokens(token, issued)
          : { ...token, backendError: "LoginFailed" };
      }

      const expiresAt = token.backendExpiresAt;
      if (!expiresAt || Date.now() < expiresAt - REFRESH_MARGIN_MS) {
        return token;
      }
      return refreshBackendToken(token);
    },

    async session({ session, token }) {
      // 리프레시 토큰은 세션에 싣지 않는다. 클라이언트 자바스크립트가 읽을 수 있는 값이라
      // 노출되면 액세스 토큰이 만료돼도 계정을 계속 점유할 수 있다.
      return {
        ...session,
        accessToken: token.backendAccessToken,
        error: token.backendError,
        user: { ...session.user, ...(token.backendUser ?? {}) },
      };
    },
  },
});

export { handler as GET, handler as POST };
