// ─── Route Constants ───────────────────────────────────────────────────────────
export const ROUTE_PATHS = {
  HOME: '/',
} as const;

// ─── Data Types ────────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  title: string;
  content: string;
  order: number;       // for manual reordering in report
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  emoji: string;
  notes: Note[];
  createdAt: number;
  updatedAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export function formatFullDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Word / Char Count ────────────────────────────────────────────────────────
export function countChars(notes: Note[]): number {
  return notes.reduce((acc, n) => acc + n.title.length + n.content.length, 0);
}

// ─── Project Emoji Palette ────────────────────────────────────────────────────
export const PROJECT_EMOJIS = [
  '🤖','🧠','🚀','📦','🔬','💡','🎯','🗂️','⚙️','📊','🌐','🔧',
  '🎨','📝','🧩','🔑','⚡','🌱','🛠️','🔮',
];

// ─── Sample Data ──────────────────────────────────────────────────────────────
export const SAMPLE_PROJECT: Project = {
  id: 'sample_project_1',
  name: 'AI 에이전트 설계',
  description: '첫 번째 AI 에이전트 프로젝트',
  emoji: '🤖',
  createdAt: Date.now() - 86400000 * 2,
  updatedAt: Date.now() - 3600000,
  notes: [
    {
      id: 'note_1',
      title: '프로젝트 비전',
      content: '## 핵심 목표\n\n이 에이전트는 반복적인 데이터 정리 업무를 자동화하여 팀의 생산성을 높이는 것이 목표입니다.\n\n## 기대 효과\n\n- 문서 처리 시간 **70% 단축**\n- 24/7 무중단 운영\n- 일관된 품질 보장',
      order: 0,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'note_2',
      title: '아키텍처 설계',
      content: '## 핵심 스택\n\n- **Brain**: GPT-4o\n- **Memory**: Pinecone (벡터 DB)\n- **Framework**: LangGraph\n- **Tools**: Web Search, Code Interpreter\n\n## 데이터 흐름\n\n사용자 입력 → LLM 추론 → 도구 선택 → 결과 반환',
      order: 1,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 7200000,
    },
    {
      id: 'note_3',
      title: '개발 로드맵',
      content: '## Phase 1 — MVP (4주)\n\n- [x] 기본 대화 에이전트 구현\n- [ ] 웹 검색 도구 연동\n- [ ] Slack 알림 통합\n\n## Phase 2 — V1.0 (8주)\n\n- [ ] RAG 파이프라인 구축\n- [ ] 코드 실행 샌드박스\n- [ ] 모니터링 대시보드',
      order: 2,
      createdAt: Date.now() - 3600000 * 5,
      updatedAt: Date.now() - 1800000,
    },
  ],
};
