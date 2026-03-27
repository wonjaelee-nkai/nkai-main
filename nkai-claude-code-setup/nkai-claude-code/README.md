# 🛡️ N-Kai Claude Code 설치 가이드 (Windows)

## 전체 구조
```
n-kai-platform/
├── CLAUDE.md                    ← Kai 핵심 두뇌 (항상 로드)
├── .mcp.json                    ← Notion 플러그인 MCP 자동 연결
├── .claude/
│   ├── settings.json            ← Hooks + 권한 설정
│   ├── skills/
│   │   ├── notion-sync/         ← 데이터 → Notion 자동 기록
│   │   ├── poc-analysis/        ← 4대 알고리즘 자동 분석
│   │   ├── user-db/             ← 유저 DB 관리
│   │   ├── admin-report/        ← ADMIN 자동 리포트
│   │   └── legal-monitor/       ← 소송 기한·문서 관리
│   └── agents/
│       ├── db-agent.md          ← DB 전담 서브에이전트
│       └── deploy-agent.md      ← 배포 전담 서브에이전트
└── (프로젝트 코드들)
```

---

## ① Windows 설치 (5분)

### Step 1: Git for Windows 설치
```
https://git-scm.com/download/win
→ 기본 옵션 그대로 설치
```

### Step 2: PowerShell에서 Claude Code 설치
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Step 3: 설치 확인
```powershell
claude --version
```

---

## ② Notion 플러그인 설치 (2분)

```bash
# Claude Code 터미널 내에서 실행
/plugin marketplace add makenotion/claude-code-notion-plugin
/plugin install notion-workspace-plugin@notion-plugin-marketplace
# → Claude Code 재시작
# → Notion OAuth 인증 (브라우저 자동 열림)
```

---

## ③ N-Kai 프로젝트 설정 (1분)

```bash
# 이 폴더 전체를 프로젝트 루트에 복사
# 그리고 claude 실행
cd n-kai-platform
claude
```

---

## ④ 첫 번째 명령 테스트

```
> "Notion 행동로그 DB에 오늘 세션 시작 기록해"
> "유저 DB 현황 보고해"
> "PoC N-Score 현황 분석해"
```

---

## Skills 자동 호출 원리

| 입력 키워드 | 자동 호출 Skill |
|-----------|----------------|
| "기록/저장/노션에" | notion-sync |
| "분석/N-Score/알고리즘" | poc-analysis |
| "유저/신청/DB" | user-db |
| "리포트/현황/대시보드" | admin-report |
| "소송/법원/기한" | legal-monitor |
| "배포/빌드/push" | deploy-agent |
| "쿼리/INSERT/SELECT" | db-agent |
