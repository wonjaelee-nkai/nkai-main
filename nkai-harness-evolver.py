#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
#  N-KAI Harness Evolver v2.0
#  3-Agent Loop: Planner → Generator → Evaluator (루프백)
#  + SKILL MD 자동생성
#  뉴린카이로스에이아이(주) | Architect: 이원재
# ============================================================
#  실행:
#    python nkai-harness-evolver.py --mode batch
#    python nkai-harness-evolver.py --mode skill-gen --domain "YouTube 자동화"
#    python nkai-harness-evolver.py --mode evolve --skill 09
# ============================================================

import os
import sys
import json
import glob
import argparse
import time
from datetime import datetime

# ─────────────────────────────────────────
# 0. 설정
# ─────────────────────────────────────────
if os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as _ef:
        for _line in _ef:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip().strip("'\""))

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
SKILLS_DIR = os.environ.get("SKILLS_DIR", ".")
MAX_RETRIES = 3
PASS_THRESHOLD = 0.75

LIVING_PROFILE_PAGE = "315f60bb-7d6a-810e-bcae-fc6eaf0a4c8b"


# ─────────────────────────────────────────
# 1. Claude API 호출
# ─────────────────────────────────────────
def call_claude(system_prompt, user_prompt, max_tokens=2000):
    import urllib.request
    if not ANTHROPIC_API_KEY:
        print("[오류] ANTHROPIC_API_KEY 미설정")
        return None

    data = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}]
    }).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=data,
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            result = json.loads(res.read())
        return result["content"][0]["text"]
    except Exception as e:
        print(f"[Claude 오류] {e}")
        return None


# ─────────────────────────────────────────
# 2. SKILL MD 파일 관리
# ─────────────────────────────────────────
def load_skills():
    pattern = os.path.join(SKILLS_DIR, "[0-9][0-9]_*.md")
    skills = {}
    for path in sorted(glob.glob(pattern)):
        name = os.path.basename(path)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        title = content.split("\n")[0].replace("#", "").strip()
        skills[name] = {"path": path, "title": title, "content": content}
    return skills


def save_skill(filename, content):
    path = os.path.join(SKILLS_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  [저장] {path}")
    return path


# ─────────────────────────────────────────
# 3. Notion API
# ─────────────────────────────────────────
def fetch_notion_logs(page_id=None):
    if not NOTION_TOKEN:
        return ""
    import urllib.request
    pid = page_id or LIVING_PROFILE_PAGE
    url = f"https://api.notion.com/v1/blocks/{pid}/children?page_size=20"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read())
        texts = []
        for block in data.get("results", []):
            btype = block.get("type", "")
            if btype in ("paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item"):
                rich = block.get(btype, {}).get("rich_text", [])
                for rt in rich:
                    texts.append(rt.get("plain_text", ""))
        return "\n".join(texts)
    except Exception as e:
        print(f"[Notion 오류] {e}")
        return ""


def log_to_notion(title, body):
    if not NOTION_TOKEN:
        return
    import urllib.request
    payload = json.dumps({
        "parent": {"page_id": LIVING_PROFILE_PAGE},
        "icon": {"emoji": "🧬"},
        "properties": {"title": [{"text": {"content": title}}]},
        "children": [{"object": "block", "type": "paragraph",
                       "paragraph": {"rich_text": [{"text": {"content": body[:2000]}}]}}]
    }).encode()
    req = urllib.request.Request("https://api.notion.com/v1/pages", data=payload, method="POST", headers={
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            result = json.loads(res.read())
        print(f"  [Notion] {result.get('url', '')[:60]}")
    except Exception as e:
        print(f"  [Notion 오류] {e}")


# ─────────────────────────────────────────
# 4. Planner — 목표+평가기준 정의
# ─────────────────────────────────────────
def planner(skill_content, task=""):
    print("\n[Planner] 목표 설정 중...")
    system = "당신은 N-KAI 전략 기획 AI입니다. 순수 JSON만 출력. 마크다운/코드블록 금지."
    prompt = f"""SKILL:
---
{skill_content[:3000]}
---
추가: {task or '이 SKILL 기반 콘텐츠 생성'}

JSON 반환:
{{"goal":"목표 1문장","output_type":"blog|script|report|strategy","criteria":[{{"name":"기준","weight":0.33,"description":"설명"}}],"context_summary":"요약 2문장"}}"""

    raw = call_claude(system, prompt, 800)
    if not raw:
        return None
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        plan = json.loads(cleaned)
        print(f"  목표: {plan.get('goal', '')[:60]}")
        return plan
    except Exception as e:
        print(f"  [파싱 오류] {e}")
        return None


# ─────────────────────────────────────────
# 5. Generator — 콘텐츠 생성
# ─────────────────────────────────────────
def generator(plan, skill_content, attempt=1):
    print(f"\n[Generator] 생성 시도 {attempt}/{MAX_RETRIES}...")
    system = "당신은 N-KAI 콘텐츠 생성 AI입니다. 한국어, 전문적이되 읽기 쉽게."
    criteria_text = "\n".join([f"- {c['name']}({c['weight']}): {c['description']}" for c in plan.get("criteria", [])])
    prompt = f"목표: {plan.get('goal','')}\n형식: {plan.get('output_type','report')}\n맥락: {plan.get('context_summary','')}\n\n평가기준:\n{criteria_text}\n\nSKILL:\n{skill_content[:2000]}"
    if attempt > 1:
        prompt += f"\n\n⚠️ 이전 시도 미달. 품질 강화 필요. (시도 {attempt})"
    result = call_claude(system, prompt, 1500)
    if result:
        print(f"  생성: {len(result)}자")
    return result


# ─────────────────────────────────────────
# 6. Evaluator — 0~1 채점
# ─────────────────────────────────────────
def evaluator(plan, content):
    print("\n[Evaluator] 채점 중...")
    system = "당신은 N-KAI 품질 평가 AI입니다. 순수 JSON만 출력."
    criteria_text = "\n".join([f"- {c['name']}({c['weight']}): {c['description']}" for c in plan.get("criteria", [])])
    prompt = f"""목표: {plan.get('goal','')}
평가기준:
{criteria_text}

콘텐츠:
{content[:2500]}

JSON:
{{"scores":[{{"name":"기준","score":0.85,"feedback":"이유"}}],"total_score":0.78,"pass":true,"summary":"종합 1문장"}}"""

    raw = call_claude(system, prompt, 600)
    if not raw:
        return {"total_score": 0, "pass": False, "summary": "평가 실패"}
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        result = json.loads(cleaned)
        score = result.get("total_score", 0)
        result["pass"] = score >= PASS_THRESHOLD
        print(f"  총점: {score:.2f} → {'PASS ✅' if result['pass'] else 'FAIL ❌'}")
        for s in result.get("scores", []):
            print(f"    {s['name']}: {s['score']:.2f}")
        return result
    except Exception as e:
        print(f"  [파싱 오류] {e}")
        return {"total_score": 0, "pass": False, "summary": str(e)}


# ─────────────────────────────────────────
# 7. 3-Agent 루프
# ─────────────────────────────────────────
def run_harness(skill_content, task=""):
    print("=" * 60)
    print(" N-KAI Harness Evolver — 3-Agent Loop")
    print("=" * 60)

    plan = planner(skill_content, task)
    if not plan:
        return None

    for attempt in range(1, MAX_RETRIES + 1):
        content = generator(plan, skill_content, attempt)
        if not content:
            continue
        eval_result = evaluator(plan, content)
        if eval_result.get("pass"):
            print(f"\n✅ PASS — 시도 {attempt}, 점수 {eval_result['total_score']:.2f}")
            return {"plan": plan, "content": content, "evaluation": eval_result, "attempts": attempt}
        print(f"  ❌ 미달 → 루프백")

    print(f"\n[실패] {MAX_RETRIES}회 기준 미달")
    return None


# ─────────────────────────────────────────
# 8. SKILL 자동생성
# ─────────────────────────────────────────
def generate_skill(domain):
    print("=" * 60)
    print(f" SKILL 자동생성 — {domain}")
    print("=" * 60)

    notion_logs = fetch_notion_logs()
    skills = load_skills()
    existing = "\n".join([f"- {k}: {v['title']}" for k, v in skills.items()])
    next_num = len(skills) + 1
    filename = f"{next_num:02d}_{domain.replace(' ', '-').lower()}.md"

    plan = {
        "goal": f"'{domain}' SKILL MD 생성",
        "output_type": "skill_md",
        "criteria": [
            {"name": "구조 완성도", "weight": 0.3, "description": "트리거/핵심 구조/실행 가이드 포함"},
            {"name": "실행 가능성", "weight": 0.4, "description": "즉시 실행 가능한 구체적 지시"},
            {"name": "N-KAI 맥락", "weight": 0.3, "description": "N-KAI 생태계 연결성"},
        ],
        "context_summary": f"도메인: {domain}",
    }

    system = "당신은 N-KAI SKILL 문서 전문가입니다."
    prompt = f"""도메인: {domain}

기존 SKILL:
{existing}

Notion 로그:
{notion_logs[:1500] if notion_logs else '(없음)'}

형식:
# N-KAI {domain} — SKILL v1.0
## 트리거
## 핵심 구조
## 실행 가이드
## 자동화 파이프라인
## KPI 지표"""

    for attempt in range(1, MAX_RETRIES + 1):
        print(f"\n[Generator] SKILL 초안 (시도 {attempt})...")
        content = call_claude(system, prompt, 2000)
        if not content:
            continue
        eval_result = evaluator(plan, content)
        if eval_result.get("pass"):
            save_skill(filename, content)
            log_to_notion(f"[SKILL] {filename} — {domain}", f"점수: {eval_result['total_score']:.2f}")
            print(f"\n✅ SKILL 저장: {filename}")
            return {"filename": filename, "content": content, "evaluation": eval_result}
        prompt += f"\n⚠️ 피드백: {eval_result.get('summary','')} (점수 {eval_result['total_score']:.2f})"

    print(f"\n[실패] SKILL 생성 {MAX_RETRIES}회 미달")
    return None


# ─────────────────────────────────────────
# 9. Batch 모드
# ─────────────────────────────────────────
def run_batch():
    print("=" * 60)
    print(f" Harness Evolver Batch — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    skills = load_skills()
    if not skills:
        print("[오류] SKILL 없음")
        return

    print(f"\nSKILL: {len(skills)}개")
    results = []

    for name, info in skills.items():
        print(f"\n{'─' * 50}\n  📄 {name}: {info['title']}\n{'─' * 50}")
        result = run_harness(info["content"])
        results.append({
            "skill": name, "title": info["title"],
            "success": result is not None,
            "score": result["evaluation"]["total_score"] if result else 0,
            "attempts": result["attempts"] if result else MAX_RETRIES,
        })

    passed = sum(1 for r in results if r["success"])
    print(f"\n{'=' * 60}\n  Batch 결과: {passed}/{len(results)} 통과\n{'=' * 60}")
    for r in results:
        print(f"  {'✅' if r['success'] else '❌'} {r['skill']}: {r['score']:.2f} ({r['attempts']}회)")

    log_to_notion(
        f"[Harness] Batch {datetime.now().strftime('%Y-%m-%d')} — {passed}/{len(results)}",
        "\n".join([f"{'✅' if r['success'] else '❌'} {r['skill']}: {r['score']:.2f}" for r in results])
    )
    return results


# ─────────────────────────────────────────
# 10. Evolve 모드
# ─────────────────────────────────────────
def run_evolve(skill_num):
    skills = load_skills()
    for name, info in skills.items():
        if name.startswith(f"{int(skill_num):02d}_"):
            print(f"  대상: {name}: {info['title']}")
            return run_harness(info["content"], "이 SKILL을 최신 상태로 진화")
    print(f"[오류] SKILL {skill_num} 없음")
    return None


# ─────────────────────────────────────────
# 11. 메인
# ─────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="N-KAI Harness Evolver")
    parser.add_argument("--mode", default="batch", choices=["batch", "skill-gen", "evolve"])
    parser.add_argument("--domain", default="")
    parser.add_argument("--skill", default="")
    args = parser.parse_args()

    start = time.time()

    if args.mode == "batch":
        run_batch()
    elif args.mode == "skill-gen":
        if not args.domain:
            print("[오류] --domain 필수")
            sys.exit(1)
        generate_skill(args.domain)
    elif args.mode == "evolve":
        if not args.skill:
            print("[오류] --skill 필수")
            sys.exit(1)
        run_evolve(args.skill)

    print(f"\n⏱  {time.time() - start:.1f}초")
