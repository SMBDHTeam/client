"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./axios";

/**
 * 관리자 화면의 조회 상태.
 *
 * 네 화면이 모두 "불러오는 중 / 실패 / 결과" 세 갈래를 갖는다. 각자 쓰면 화면마다
 * 오류 문구와 재시도 동작이 조금씩 달라진다.
 *
 * <p>의존성 배열 대신 조건을 나타내는 `key` 문자열을 받는다. 호출부가 무엇이 바뀌면
 * 다시 불러야 하는지 한 줄로 드러내고, 훅 안에서는 평범한 배열 리터럴로 다룰 수 있다.
 *
 * <p>`loading` 을 state 로 두지 않고 계산한다. effect 안에서 곧바로 setState 를 하면
 * 렌더가 한 번 더 돈다. 지금 조건과 마지막으로 받아 둔 결과의 조건이 다르면 아직 안 온 것이다.
 *
 * <p>다시 불러오는 동안 이전 결과를 지우지 않는다. 필터를 바꿀 때마다 목록이 사라졌다
 * 나타나면 화면이 심하게 흔들린다.
 */
export function useAdminQuery<T>(load: () => Promise<T>, key: string) {
  const [reloadKey, setReloadKey] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    token: string;
    data: T | null;
    error: string | null;
  } | null>(null);

  const token = `${key}#${reloadKey}`;
  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let alive = true;

    load()
      .then((data) => {
        if (alive) setSnapshot({ token, data, error: null });
      })
      .catch((cause: unknown) => {
        // 실패했을 때 이전 결과를 남기지 않는다. 낡은 목록 위에 오류만 뜨면
        // 지금 보이는 것이 언제 것인지 알 수 없다.
        if (alive) setSnapshot({ token, data: null, error: describe(cause) });
      });

    return () => {
      alive = false;
    };
    // load 는 매 렌더 새로 만들어지므로 넣지 않는다. 조건은 token 이 대표한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const settled = snapshot?.token === token;

  return {
    data: snapshot?.data ?? null,
    error: settled ? snapshot.error : null,
    loading: !settled,
    reload,
  };
}

/** 서버가 준 사유를 그대로 보여 준다. 관리자 화면이라 원문이 도움이 된다. */
function describe(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 401) return "로그인이 만료됐습니다. 다시 로그인해 주세요.";
    if (cause.status === 403) return "권한이 없습니다.";
    return cause.payload.message || `요청이 실패했습니다. (${cause.status})`;
  }
  return "서버에 연결하지 못했습니다.";
}
