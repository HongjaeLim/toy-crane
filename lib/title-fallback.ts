export interface TitleResult {
  title: string;
  narrative: string;
}

// AI 생성 실패 시 점수 구간별 결정적 칭호. 사용자는 에러 화면 대신 이 카드를 본다.
export function fallbackTitle(score: number): TitleResult {
  if (score <= 30) {
    return {
      title: "맑은 길의 산책자",
      narrative: "큰 시련 없이 평온하게 책상까지 다다른 가벼운 출근.",
    };
  }
  if (score <= 60) {
    return {
      title: "끈기의 출근자",
      narrative: "이런저런 방해를 견디며 한 걸음씩, 오늘도 자리를 지켰다.",
    };
  }
  return {
    title: "역경의 출근자",
    narrative: "거센 환경을 정면으로 뚫고 끝내 책상이라는 성에 도달했다.",
  };
}
