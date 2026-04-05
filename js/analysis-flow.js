// ==========================================
// ANALYSIS FLOW — ES5 전용 (optional chaining/const/let/화살표함수/template literal 금지)
// Last updated: 2026.03.23 by Kai
// ==========================================

function startAnalysis() {
    var privacy = document.getElementById('privacy_check').checked;
    var name    = document.getElementById('input-name').value.trim();
    var email   = document.getElementById('input-email').value.trim();
    var birth   = document.getElementById('input-birthdate').value.trim();
    if(!name||!email||!birth) { alert('성함, 이메일, 생년월일을 입력해주세요.'); return; }
    if(!privacy) { alert('개인정보 수집 및 이용에 동의해주세요.'); return; }
    if(birth.length !== 8 || isNaN(birth)) { alert('생년월일을 YYYYMMDD 형식으로 입력해주세요.'); return; }

    var answers = {};
    // Q1~Q8 수집 — .kipa-opt 텍스트 버튼 기반 (v4: 8Q 축소)
    for(var i=1; i<=8; i++) {
        var sel = document.querySelector('.kipa-opt[data-q="'+i+'"].selected');
        if(!sel) { alert('KIPA Q'+i+'번 문항에 응답해주세요.'); return; }
        answers['q'+i] = sel ? parseInt(sel.getAttribute('data-v')) : 3;
    }
    var kipaMode = '8q';

    // ★ KIPA 점수 계산 v4.0 — 8Q 재보정, 5지선다 스케일 (1~5 → 20~80 변환)
    function toScore(v) { return (6 - (v || 3)) * 15 + 20; }

    // E/I축 (Q1,Q2) — 보정계수 1.5배
    var EI_W = { q1:1.5, q2:1.5 }; var EI_T = 3.0;
    var ei = Math.round((toScore(answers.q1)*EI_W.q1 + toScore(answers.q2)*EI_W.q2) / EI_T);

    // N/S축 (Q3,Q4) — 핵심 투자 의사결정 문항
    var NS_W = { q3:1.8, q4:1.8 }; var NS_T = 3.6;
    var ns = Math.round((toScore(answers.q3)*NS_W.q3 + toScore(answers.q4)*NS_W.q4) / NS_T);

    // T/F축 (Q5,Q6) — Q6(수익 vs 가치) 핵심 가중
    var TF_W = { q5:1.0, q6:2.0 }; var TF_T = 3.0;
    var tf = Math.round((toScore(answers.q5)*TF_W.q5 + toScore(answers.q6)*TF_W.q6) / TF_T);

    // J/P축 (Q7,Q8) — Q7(예산 관리) 핵심 가중
    var JP_W = { q7:2.0, q8:1.5 }; var JP_T = 3.5;
    var jp = Math.round((toScore(answers.q7)*JP_W.q7 + toScore(answers.q8)*JP_W.q8) / JP_T);

    // ★ NaN 방어 — 0이 되면 saju-engine에서 N-Score가 0으로 계산됨
    if(isNaN(ei)) ei = 50; if(isNaN(ns)) ns = 50; if(isNaN(tf)) tf = 50; if(isNaN(jp)) jp = 50;
    console.log('[N-KAI] KIPA v3 scores: ei='+ei+' ns='+ns+' tf='+tf+' jp='+jp);
    currentUserBirthDate = birth; currentUserEmail = email; currentUserName = name;

    var region = document.getElementById('input-region').value;
    var gender = document.getElementById('input-gender').value;
    var job    = document.getElementById('input-job').value;

    var userData = {
        name: name, email: email, birth: birth,
        region: region, gender: gender, job: job,
        ei: ei, ns: ns, tf: tf, jp: jp,
        answers: answers, timestamp: new Date().toISOString()
    };
    if(!Array.isArray(allUserData)) allUserData = [];
    allUserData.push(userData);

    // ── PROTECTED: sessionStorage 저장 ──
    sessionStorage.setItem('nkai_user_birth',   birth);
    sessionStorage.setItem('nkai_user_region',  region);
    sessionStorage.setItem('nkai_user_gender',  gender);
    sessionStorage.setItem('nkai_user_job',     job);
    var btEl = document.getElementById('input-bloodtype');
    if(btEl && btEl.value) sessionStorage.setItem('nkai_user_bloodtype', btEl.value);
    for(var qi=1; qi<=8; qi++) sessionStorage.setItem('nkai_kipa_q'+qi, answers['q'+qi] || '');
    sessionStorage.setItem('nkai_kipa_mode', kipaMode);
    // ── END PROTECTED ──

    var simInput   = document.getElementById('sim-input');
    var simProcess = document.getElementById('sim-process');
    if(simInput)   simInput.style.display = 'none';
    if(simProcess) simProcess.classList.remove('hidden');

    var steps = ['xai-s1','xai-s2','xai-s3','xai-s4','xai-s5','xai-s6'];
    steps.forEach(function(id, idx) {
        setTimeout(function() {
            var el = document.getElementById(id);
            if(el) { el.classList.add('completed'); el.style.color = '#fff'; }
        }, idx * 400);
    });

    var logs = [
        "S3010: Structuring innate trait data...",
        "S3020: Mapping energy distribution...",
        "S3030: Computing 4 Core Factors...",
        "S4010: Generating KIPA Behavioral DNA...",
        "S4030: Calibrating Resonance/Conflict \u2192 Fused DNA...",
        "S4040: Clustering 16-Type Financial DNA..."
    ];
    var logIdx = 0;
    var interval = setInterval(function() {
        if(logIdx < logs.length) {
            var pl = document.getElementById('process-log');
            if(pl) pl.innerText = logs[logIdx++];
        }
    }, 400);

    setTimeout(function() {
        clearInterval(interval);

        var hourEl  = document.getElementById('input-birthtime');
        var hourVal = (hourEl && hourEl.value) ? hourEl.value : '';

        var vCore      = computeInnateVector(birth, hourVal);
        var vBehavior  = computeBehaviorVector(ei, ns, tf, jp);

        // ★ Q17~20 소비행동 수집 — calibrateVectors v4.0 삼원 융합에 전달
        var _bqSpending = document.querySelector('input[name="behavior-spending"]:checked');
        var _bqImpulse  = document.querySelector('input[name="behavior-impulse"]:checked');
        var _bqWindfall = document.querySelector('input[name="behavior-windfall"]:checked');
        var _bqTracking = document.querySelector('input[name="behavior-tracking"]:checked');
        var behaviorQuiz = null;
        if(_bqSpending && _bqImpulse && _bqWindfall && _bqTracking) {
            behaviorQuiz = {
                spending:  parseInt(_bqSpending.value),
                impulse:   parseInt(_bqImpulse.value),
                windfall:  parseInt(_bqWindfall.value),
                tracking:  parseInt(_bqTracking.value)
            };
            sessionStorage.setItem('nkai_sq1', String(behaviorQuiz.spending));
            localStorage.setItem('nkai_sq1',   String(behaviorQuiz.spending));
            sessionStorage.setItem('nkai_sq2', String(behaviorQuiz.impulse));
            localStorage.setItem('nkai_sq2',   String(behaviorQuiz.impulse));
            sessionStorage.setItem('nkai_sq3', String(behaviorQuiz.windfall));
            localStorage.setItem('nkai_sq3',   String(behaviorQuiz.windfall));
            sessionStorage.setItem('nkai_sq4', String(behaviorQuiz.tracking));
            localStorage.setItem('nkai_sq4',   String(behaviorQuiz.tracking));
            console.log('[N-KAI] behaviorQuiz:', behaviorQuiz);
        }

        // ── S4040 군집화 + N-Score 산출 (3초 타임아웃 안전장치) ──
        var _s4040Done = false;
        var _s4040Timer = setTimeout(function() {
            if(!_s4040Done) {
                console.error('[N-KAI] S4040 TIMEOUT: 군집화 3초 초과 — fallback 적용');
                var pl = document.getElementById('process-log');
                if(pl) pl.innerText = 'S4040: Fallback archetype applied...';
            }
        }, 3000);

        var vFused, archetypeCode, result, nScoreResult, _bb;
        try {
            vFused        = calibrateVectors(vCore, vBehavior, behaviorQuiz);
            archetypeCode = classifyArchetype(vFused);
            result        = nkaiDatabase[archetypeCode];

            if(!result) {
                console.warn('[N-KAI] S4040: nkaiDatabase[' + archetypeCode + '] 누락 — ISTJ fallback');
                archetypeCode = 'ISTJ';
                result = nkaiDatabase['ISTJ'];
            }

            nScoreResult = computeNScore(vCore, vFused);

            // ★ behaviorBonus N-Score 반영
            if(behaviorQuiz && typeof computeBehaviorBonus === 'function') {
                _bb = computeBehaviorBonus(behaviorQuiz, archetypeCode);
                if(_bb && _bb.totalBonus) {
                    nScoreResult.score  = Math.max(200, Math.min(950, nScoreResult.score + _bb.totalBonus));
                    nScoreResult.ciLow  = nScoreResult.score - Math.round(nScoreResult.score * 0.08);
                    nScoreResult.ciHigh = nScoreResult.score + Math.round(nScoreResult.score * 0.08);
                    console.log('[N-KAI] behaviorBonus +' + _bb.totalBonus + ' \u2192 N-Score:', nScoreResult.score);
                }
            }
        } catch(s4040err) {
            console.error('[N-KAI] S4040 ERROR:', s4040err);
            vFused        = vFused || {EI:0, NS:0, TF:0, JP:0};
            archetypeCode = archetypeCode || 'ISTJ';
            result        = nkaiDatabase[archetypeCode] || nkaiDatabase['ISTJ'];
            nScoreResult  = nScoreResult || {score:520, ciLow:478, ciHigh:562};
        }
        _s4040Done = true;
        clearTimeout(_s4040Timer);

        var finalScore = nScoreResult.score;
        computedResults = {
            vCore: vCore, vBehavior: vBehavior, vFused: vFused,
            archetypeCode: archetypeCode, result: result, nScoreResult: nScoreResult,
            kipaScores: { ei: ei, ns: ns, tf: tf, jp: jp }
        };

        var rg = calculateNGrade(finalScore);

        // ★ DEBUG: archPayload 구성 직전 vCore 값 확인
        console.log('[N-KAI DEBUG] vCore.dayElement=', vCore.dayElement, 'strengthIndex=', vCore.strengthIndex, 'strengthType=', vCore.strengthType);
        console.log('[N-KAI DEBUG] vCore.wealthScore=', vCore.wealthScore, 'expressionScore=', vCore.expressionScore);
        console.log('[N-KAI DEBUG] vCore.ohengScore=', JSON.stringify(vCore.ohengScore));
        console.log('[N-KAI DEBUG] vCore.goldenCalendar length=', vCore.goldenCalendar ? vCore.goldenCalendar.length : 'NULL');
        console.log('[N-KAI DEBUG] _bb=', _bb ? JSON.stringify(_bb) : 'EMPTY');

        // 아키타입 확정 GAS 전송
        var birthtimeEl  = document.getElementById('input-birthtime');
        var bloodtypeEl  = document.getElementById('input-bloodtype');
        var archPayload = {
            name: currentUserName, email: currentUserEmail, birthdate: birth,
            birthtime:  (birthtimeEl  && birthtimeEl.value)  ? birthtimeEl.value  : '',
            region:     document.getElementById('input-region').value,
            gender:     document.getElementById('input-gender').value,
            job:        document.getElementById('input-job').value,
            bloodtype:  (bloodtypeEl  && bloodtypeEl.value)  ? bloodtypeEl.value  : (sessionStorage.getItem('nkai_user_bloodtype') || ''),
            type: '\uc544\ud0a4\ud0c0\uc785\ud655\uc815',
            archetype: archetypeCode, kipa_mode: kipaMode,
            nscore: finalScore, ngrade: rg.grade, precision: vCore.precision,
            kipa_energy: ei, kipa_perception: ns, kipa_judgment: tf, kipa_lifestyle: jp,
            kipa_q1:  answers.q1,  kipa_q2:  answers.q2,  kipa_q3:  answers.q3,
            kipa_q4:  answers.q4,  kipa_q5:  answers.q5,  kipa_q6:  answers.q6,
            kipa_q7:  answers.q7,  kipa_q8:  answers.q8,
            sq1: behaviorQuiz ? String(behaviorQuiz.spending)  : '',
            sq2: behaviorQuiz ? String(behaviorQuiz.impulse)   : '',
            sq3: behaviorQuiz ? String(behaviorQuiz.windfall)  : '',
            sq4: behaviorQuiz ? String(behaviorQuiz.tracking)  : '',
            breakdown_innate:  JSON.stringify({dayElement:vCore.dayElement, strengthIndex:vCore.strengthIndex, strengthType:vCore.strengthType, wealthScore:vCore.wealthScore, expressionScore:vCore.expressionScore, ohengScore:vCore.ohengScore, precision:vCore.precision}),
            breakdown_kipa:    JSON.stringify({ei:ei, ns:ns, tf:tf, jp:jp, vBehavior:vBehavior}),
            breakdown_dynamic: JSON.stringify({vFused:vFused, archetypeCode:archetypeCode, calibration:'v4.0_50-35-15'}),
            behavior_bonus:    (typeof _bb !== 'undefined' && _bb) ? JSON.stringify(_bb) : '',
            goldenCalendar:    vCore.goldenCalendar || [],
            session_id: sessionStorage.getItem('nkai_sid') || '',
            device:    /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            url:       location.href,
            timestamp: new Date().toISOString()
        };
        // ★ breakdown 데이터를 sessionStorage에 저장 — 결제 payload에서 사용
        sessionStorage.setItem('nkai_breakdown_innate',  archPayload.breakdown_innate  || '');
        sessionStorage.setItem('nkai_breakdown_kipa',    archPayload.breakdown_kipa    || '');
        sessionStorage.setItem('nkai_breakdown_dynamic', archPayload.breakdown_dynamic || '');
        sessionStorage.setItem('nkai_breakdown_bonus',   archPayload.behavior_bonus    || '');
        try {
            var gasUrl = (typeof CONFIG !== 'undefined' && CONFIG.WEB_APP_URL)
                ? CONFIG.WEB_APP_URL
                : (typeof WEB_APP_URL !== 'undefined' ? WEB_APP_URL : null);
            if(gasUrl) {
                fetch(gasUrl, {
                    method:'POST', mode:'no-cors', keepalive:true,
                    headers:{'Content-Type':'text/plain'},
                    body: JSON.stringify(archPayload)
                });
                console.log('[N-KAI] \u2605 \uc544\ud0a4\ud0c0\uc785\ud655\uc815 POST \uc804\uc1a1:', archetypeCode, currentUserEmail);
            }
        } catch(e) {
            try { navigator.sendBeacon(gasUrl, new Blob([JSON.stringify(archPayload)], {type:'text/plain'})); } catch(e2) {}
        }

        // Admin 분석용 데이터 업데이트
        if(allUserData.length > 0) {
            var last = allUserData[allUserData.length - 1];
            last.archetypeCode  = archetypeCode;
            last.archetypeGroup = result.group;
            last.nscore         = finalScore;
            last.ngrade         = rg.grade;
        }

        var simProc = document.getElementById('sim-process');
        var simRes  = document.getElementById('sim-result');
        if(simProc) simProc.classList.add('hidden');
        if(simRes)  { simRes.classList.remove('hidden'); simRes.classList.add('active'); }

        // 퍼널 트래킹 step_07
        window.dispatchEvent(new CustomEvent('nkai-analysis-complete', { detail: {
            archetypeCode: archetypeCode, nscore: finalScore, ngrade: rg.grade,
            kipaMode: kipaMode, kipa_energy: ei, kipa_perception: ns,
            kipa_judgment: tf, kipa_lifestyle: jp
        }}));

        if(window.NKAITracker && window.NKAITracker.trackFunnel) {
            window.NKAITracker.trackFunnel('step_07', '\ubd84\uc11d \uc644\ub8cc', {
                email: currentUserEmail, archetype: archetypeCode,
                nscore: finalScore, kipa_energy: ei, kipa_perception: ns,
                kipa_judgment: tf, kipa_lifestyle: jp
            });
        }

        var gb = document.getElementById('n-grade-badge');
        if(gb) {
            gb.innerText = rg.grade + ' ' + rg.label;
            gb.style.color       = rg.color;
            gb.style.borderColor = rg.color;
        }

        // 정밀도 배지
        var precBadge = document.getElementById('precision-badge');
        if(precBadge) {
            if(vCore.hasHour) {
                precBadge.innerHTML = '<span style="color:#00D68F;">\u2726 \uc815\ubc00\ub3c4 94% \u2014 \uc2dc\uc8fc(\u6642\u67f1) \ubc18\uc601 \uc644\ub8cc</span>';
            } else {
                precBadge.innerHTML = '<span style="color:#8A95AB;">\uc815\ubc00\ub3c4 82%</span>' +
                    ' <span style="color:#7C5BF0; cursor:pointer;" onclick="var b=document.getElementById(\'hour-upgrade-banner\'); if(b){b.style.display=\'block\';b.style.maxHeight=\'300px\';b.style.opacity=\'1\';b.scrollIntoView({behavior:\'smooth\',block:\'center\'});}">' +
                    '\u00b7 \ucd9c\uc0dd\uc2dc\uac04 \ucd94\uac00 \uc2dc 94%\ub85c \ud5a5\uc0c1 \u2192</span>';
            }
        }

        // 결과 카드 업데이트
        var resultElMap = {
            'result-group-tag':  '[' + result.group + ']',
            'result-archetype':  '"' + result.title + '"',
            'result-summary':    result.summary,
            'result-identity':   result.identity,
            'result-trajectory': result.trajectory
        };
        var mapKeys = Object.keys(resultElMap);
        for(var ri=0; ri<mapKeys.length; ri++) {
            var rel = document.getElementById(mapKeys[ri]);
            if(rel) rel.innerText = resultElMap[mapKeys[ri]];
        }

        var archetypeCodeEl = document.getElementById('result-archetype-code');
        if(archetypeCodeEl) archetypeCodeEl.innerText = archetypeCode;

        var compassTextEl = document.getElementById('result-compass-text');
        if(compassTextEl) compassTextEl.innerText = result.compass;

        // 상위 % (N-Score 기반)
        var percentile    = Math.max(5, Math.min(95, Math.round(100 - (finalScore / 10))));
        var percentileEl  = document.getElementById('result-percentile');
        if(percentileEl) percentileEl.innerText = '\uc0c1\uc704 ' + percentile + '%';

        // 3대 지표 계산
        var oheng           = vCore.ohengScore || vCore.ohengCount || {'\u6728':1, '\u706b':1, '\u571f':2, '\u91d1':1, '\u6c34':1};
        var wealthScore     = vCore.wealthScore     || 0.5;
        var strengthIndex   = vCore.strengthIndex   || 0.5;
        var expressionScore = vCore.expressionScore || 0.3;

        var fTF = (vFused.TF || 0);
        var fEI = (vFused.EI || 0);
        var fJP = (vFused.JP || 0);
        var fNS = (vFused.NS || 0);

        // 💰 경제감각
        var wealthEnergy = Math.round(
            wealthScore * 55 +
            (oheng['\u91d1'] || 1) * 7 + (oheng['\u571f'] || 1) * 5 +
            fTF * 12 + fNS * 5 + 20
        );
        // ⚡ 표현에너지
        var opportunityScore = Math.round(
            expressionScore * 45 +
            (oheng['\u6728'] || 1) * 9 + (oheng['\u706b'] || 1) * 7 +
            fEI * 14 + fNS * 8 + 25
        );
        // 🛡 위기대응력
        var riskTolerance = Math.round(
            strengthIndex * 50 +
            (oheng['\u6c34'] || 1) * 8 + (oheng['\u91d1'] || 1) * 6 +
            fJP * 15 + fTF * 8 + 20
        );

        var wealthEl = document.getElementById('result-wealth-energy');
        if(wealthEl) wealthEl.innerText = Math.min(99, Math.max(35, wealthEnergy)) + '%';

        var oppEl = document.getElementById('result-opportunity');
        if(oppEl) oppEl.innerText = Math.min(99, Math.max(35, opportunityScore)) + '%';

        var riskEl = document.getElementById('result-risk-tolerance');
        if(riskEl) riskEl.innerText = Math.min(99, Math.max(35, riskTolerance)) + '%';

        var kaiInsightEl = document.getElementById('result-kai-insight');
        if(kaiInsightEl) kaiInsightEl.innerText = result.compass;

        // 시간 미입력 → 업그레이드 배너
        showHourUpgradeBanner();

        // N-Score 표시 (떨림 제거)
        var sd = document.getElementById('score-display');
        if(sd) sd.innerText = finalScore;

        var ngf = document.getElementById('n-grade-fill');
        if(ngf) ngf.style.width = ((finalScore/1000)*100) + '%';

        var ciLowEl  = document.getElementById('ci-low');
        var ciHighEl = document.getElementById('ci-high');
        if(ciLowEl)  ciLowEl.innerText  = nScoreResult.ciLow;
        if(ciHighEl) ciHighEl.innerText = nScoreResult.ciHigh;

        var ciC = (finalScore/1000)*100;
        var ciW = ((nScoreResult.ciHigh - nScoreResult.ciLow)/1000)*100;
        var ciRangeEl = document.getElementById('ci-range');
        if(ciRangeEl) {
            ciRangeEl.style.left  = (ciC - ciW/2) + '%';
            ciRangeEl.style.width = ciW + '%';
        }
        setTimeout(function() {
            var ciFill = document.getElementById('ci-fill');
            if(ciFill) ciFill.style.width = ciC + '%';
        }, 500);

        renderXAIPanel(vCore, vBehavior, vFused, archetypeCode);

        // ── PROTECTED: _nkaiResult 전역 저장 ──
        var ohengTotal = 0;
        var ohengKeys = Object.keys(oheng);
        for(var oi=0; oi<ohengKeys.length; oi++) ohengTotal += oheng[ohengKeys[oi]];
        ohengTotal = ohengTotal || 1;

        var ohengSorted = ohengKeys.slice().sort(function(a,b){ return (oheng[b]||0)-(oheng[a]||0); });
        var ohengParts  = [];
        for(var os=0; os<ohengSorted.length; os++) {
            ohengParts.push(ohengSorted[os] + ' ' + Math.round((oheng[ohengSorted[os]]||0)/ohengTotal*100) + '%');
        }
        var ohengStr = ohengParts.join(' \u00b7 ');

        var portfolioMap = {
            '\ud56d\ud574\uc0ac': '\uc131\uc7a5\uc8fc 40% \u00b7 ETF 25% \u00b7 \uccb4\uad8c 20% \u00b7 \ub300\uc548 15%',
            '\ubd84\uc11d\uac00': '\uccb4\uad8c 35% \u00b7 ETF 30% \u00b7 \uc131\uc7a5\uc8fc 20% \u00b7 \ub300\uc548 15%',
            '\uc2e4\uc6a9\uc8fc\uc758': '\uccb4\uad8c 40% \u00b7 ETF 30% \u00b7 \ubc30\ub2f9\uc8fc 20% \u00b7 \uc608\uae08 10%',
            '\ube44\uc804\uac00': '\uc131\uc7a5\uc8fc 35% \u00b7 ETF 30% \u00b7 \uccb4\uad8c 25% \u00b7 \ub300\uc548 10%'
        };
        var riskMap = {
            '\ud56d\ud574\uc0ac': '\uacf5\uaca9\ud615',
            '\ubd84\uc11d\uac00': '\uade0\ud615\ud615',
            '\uc2e4\uc6a9\uc8fc\uc758': '\uc548\uc815\ud615',
            '\ube44\uc804\uac00': '\uc801\uadf9\ud615'
        };

        var gtText = '\uc774\ubc88 \ub2ec \uc5d0\ub108\uc9c0 \ubd84\uc11d \uc900\ube44 \uc911';
        if(vCore.goldenCalendar && vCore.goldenCalendar.length > 0) {
            var nowMonth = new Date().getMonth() + 1;
            var cm = null;
            for(var gi=0; gi<vCore.goldenCalendar.length; gi++) {
                if(vCore.goldenCalendar[gi].month === nowMonth) { cm = vCore.goldenCalendar[gi]; break; }
            }
            if(cm) gtText = cm.monthName + ' ' + cm.goldenStars + ' \u2014 ' + cm.advice;
        }

        var ohengPcts = {
            wood:  Math.round((oheng['\u6728']||0)/ohengTotal*100),
            fire:  Math.round((oheng['\u706b']||0)/ohengTotal*100),
            earth: Math.round((oheng['\u571f']||0)/ohengTotal*100),
            metal: Math.round((oheng['\u91d1']||0)/ohengTotal*100),
            water: Math.round((oheng['\u6c34']||0)/ohengTotal*100)
        };

        window._nkaiResult = {
            code:            archetypeCode,
            archetype:       result.title,
            archetypeEn:     archetypeCode,
            mainGroup:       result.group,
            nScore:          finalScore,
            nGrade:          rg.grade,
            ns:              vFused.NS || 0,
            tf:              vFused.TF || 0,
            jp:              vFused.JP || 0,
            ei:              vFused.EI || 0,
            fiveEnergy:      ohengStr,
            ohengPcts:       ohengPcts,
            dayElement:      vCore.dayElement || '\u571f',
            goldenCalendar:  vCore.goldenCalendar || [],
            goldenTime:      gtText,
            riskProfile:     riskMap[result.group]    || '\uade0\ud615\ud615',
            portfolio:       portfolioMap[result.group] || '\uc131\uc7a5\uc8fc 30% \u00b7 ETF 30% \u00b7 \uccb4\uad8c 30% \u00b7 \ub300\uc548 10%',
            userName:        currentUserName || '\ud68c\uc6d0',
            wealthEnergy:    Math.min(99, Math.max(35, wealthEnergy)),
            opportunityScore:Math.min(99, Math.max(35, opportunityScore)),
            riskTolerance:   Math.min(99, Math.max(35, riskTolerance)),
            strengthIndex:   strengthIndex,
            expressionScore: expressionScore,
            wealthScore:     wealthScore,
            summary:         result.summary,
            identity:        result.identity,
            compass:         result.compass,
            precision:       vCore.hasHour ? '94%' : '82%',
            vCore:           vCore,
            vBehavior:       vBehavior,
            vFused:          vFused,
            // ★ FIX: sq1~sq4 GAS 전달 — 소비행동 N-Score 가산 + 시트 기록
            sq1: behaviorQuiz ? String(behaviorQuiz.spending)  : '',
            sq2: behaviorQuiz ? String(behaviorQuiz.impulse)   : '',
            sq3: behaviorQuiz ? String(behaviorQuiz.windfall)  : '',
            sq4: behaviorQuiz ? String(behaviorQuiz.tracking)  : '',
            // ★ FIX: GAS birthdate 전달 — 연령/생월 개인화 보장
            birthdate:       birth,
            birth_year:      birth && birth.length >= 4 ? parseInt(birth.substring(0,4)) : 0,
            birth_month:     birth && birth.length >= 6 ? parseInt(birth.substring(4,6)) : 0
        };
        console.log('[N-KAI] _nkaiResult \uc800\uc7a5 \uc644\ub8cc:', window._nkaiResult);

        // ★ PDF 개인화 보장 — 분석 완료 즉시 localStorage 단일 스냅샷 저장
        // 토스 결제 리다이렉트 후 페이지 재로드 시 sessionStorage 소실 방지
        // 이 키 하나만 있으면 PDF 전체 개인화 가능 — 하드코딩 fallback 불필요
        try {
            localStorage.setItem('nkai_full_result', JSON.stringify(window._nkaiResult));
            console.log('[N-KAI] nkai_full_result localStorage 저장 완료 — arch:', window._nkaiResult.code, 'nscore:', window._nkaiResult.nScore);
        } catch(e) {
            console.warn('[N-KAI] nkai_full_result 저장 실패:', e);
        }
        // ── END PROTECTED ──

        // ══════════════════════════════════════════════════════════════
        // ★ v73 — 결제 payload 동적 데이터 분석 완료 시점에 세션 저장
        // ══════════════════════════════════════════════════════════════

        // [1] 오행% 세션 저장
        sessionStorage.setItem('nkai_pay_el_wood',  String(Math.round((oheng['\u6728']||0)/ohengTotal*100)));
        sessionStorage.setItem('nkai_pay_el_fire',  String(Math.round((oheng['\u706b']||0)/ohengTotal*100)));
        sessionStorage.setItem('nkai_pay_el_earth', String(Math.round((oheng['\u571f']||0)/ohengTotal*100)));
        sessionStorage.setItem('nkai_pay_el_metal', String(Math.round((oheng['\u91d1']||0)/ohengTotal*100)));
        sessionStorage.setItem('nkai_pay_el_water', String(Math.round((oheng['\u6c34']||0)/ohengTotal*100)));

        // [2] 골든타임 주의구간 저장
        if(vCore.goldenCalendar && vCore.goldenCalendar.length > 0) {
            var gcSorted = vCore.goldenCalendar.slice().sort(function(a,b){
                return (a.goldenScore||3) - (b.goldenScore||3);
            });
            if(gcSorted[0]) sessionStorage.setItem('nkai_pay_gt_warn', gcSorted[0].monthName);
        }

        // [3] risk 동적 생성
        (function() {
            var grp = result.group || '\ubd84\uc11d\uac00';
            var riskDB = {
                '\ud56d\ud574\uc0ac':  {risk1:'\uc801\ud569', risk2:'\uc8fc\uc758', risk3:'\uc801\ud569', risk4:'\uc801\ud569', risk5:'\uc8fc\uc758', risk6:'\uc801\ud569'},
                '\ubd84\uc11d\uac00':  {risk1:'\uc8fc\uc758', risk2:'\uc801\ud569', risk3:'\uc8fc\uc758', risk4:'\uc801\ud569', risk5:'\uc8fc\uc758', risk6:'\uc801\ud569'},
                '\ube44\uc804\uac00':  {risk1:'\uc801\ud569', risk2:'\uc8fc\uc758', risk3:'\uc801\ud569', risk4:'\ubcf4\ud1b5', risk5:'\ubcf4\ud1b5', risk6:'\uc801\ud569'},
                '\uc2e4\uc6a9\uc8fc\uc758':{risk1:'\ubcf4\ud1b5', risk2:'\uc801\ud569', risk3:'\ubcf4\ud1b5', risk4:'\uc801\ud569', risk5:'\uc8fc\uc758', risk6:'\ubcf4\ud1b5'}
            };
            var baseRisk = riskDB[grp] || riskDB['\ubd84\uc11d\uac00'];
            var domEl    = Object.keys(oheng).reduce(function(a,b){ return (oheng[a]||0)>=(oheng[b]||0)?a:b; }, '\u91d1');
            if(domEl === '\u706b') baseRisk.risk5 = '\uc801\ud569';
            if(domEl === '\u571f') baseRisk.risk2 = '\uc801\ud569';
            if(domEl === '\u6c34') { baseRisk.risk4 = '\uc801\ud569'; baseRisk.risk1 = '\ubcf4\ud1b5'; }
            if(domEl === '\u6728') baseRisk.risk3 = '\uc801\ud569';
            var riskKeys = Object.keys(baseRisk);
            for(var rk=0; rk<riskKeys.length; rk++) sessionStorage.setItem('nkai_pay_'+riskKeys[rk], baseRisk[riskKeys[rk]]);
        })();

        // [4] compat 동적 생성
        (function() {
            var compatDB = {
                ENTJ:['INTJ','INFJ','ENFP'], ENTP:['INTJ','INFJ','ENTJ'],
                INTJ:['ENTJ','ENFP','INFJ'], INTP:['ENTJ','ESTJ','INFJ'],
                ENFJ:['INFP','ISFP','INTJ'], INFJ:['ENFP','ENTP','INTJ'],
                ENFP:['INTJ','INFJ','ENFJ'], INFP:['ENFJ','ENTJ','INFJ'],
                ESTJ:['ISTP','INTP','ISTJ'], ISTJ:['ESTJ','ESTP','ENTJ'],
                ESFJ:['ISFP','INFP','ISFJ'], ISFJ:['ESFJ','ESTJ','ISFP'],
                ESTP:['ISTP','ISTJ','ENTJ'], ISTP:['ESTP','ESTJ','INTJ'],
                ESFP:['ISFP','ISFJ','ESFJ'], ISFP:['ESFP','ISFJ','INFJ']
            };
            var c = compatDB[archetypeCode] || ['INTJ','INFJ','ENFP'];
            sessionStorage.setItem('nkai_pay_compat1', c[0]);
            sessionStorage.setItem('nkai_pay_compat2', c[1]);
            sessionStorage.setItem('nkai_pay_compat3', c[2]);
        })();

        // [5] pf 동적 생성
        (function() {
            var domEl3 = Object.keys(oheng).reduce(function(a,b){ return (oheng[a]||0)>=(oheng[b]||0)?a:b; }, '\u91d1');
            var pfMap = {
                '\u6728': ['\uc131\uc7a5\uc8fc\u00b7\ud14c\ud06cETF','\ubbf8\uad6d\ub098\uc2a4\ub2ecETF','\ubc14\uc774\uc624\u00b7\ud5ec\uc2a4\ucf00\uc5b4','\uc2e0\ud765\uad6dETF','\ud604\uae08'],
                '\u706b': ['\uc18c\ube44\uc7ac\u00b7\uc5d4\ud130ETF','\uad6d\ub0b4\uc131\uc7a5\uc8fc','\ud14c\ub9c8\uc8fc\u00b7\ubaa8\uba58\ud140','\ub9ac\uce20(REITs)','\ud604\uae08'],
                '\u571f': ['\ubd80\ub3d9\uc0b0\ub9ac\uce20','\ubc30\ub2f9\uc8fcETF','\uc778\ud504\ub77c\ud3bc\ub4dc','\uccb4\uad8c\ud63c\ud569','\ud604\uae08'],
                '\u91d1': ['\uae08\ud604\ubb3c\u00b7\uadc0\uae08\uc18d','\ubbf8\uad6d\ucc44ETF','\uac00\uce58\uc8fc\u00b7\ubc30\ub2f9','\uccb4\uad8cETF','\ud604\uae08'],
                '\u6c34': ['\uc678\ud658\u00b7\uae00\ub85c\ubc8cETF','\uccb4\uad8c\u00b7\uba38\ub2c8\ub9c8\ucf13','\uc720\ub3d9\uc131\uc790\uc0b0','\ubc30\ub2f9\uc131\uc7a5\uc8fc','\ud604\uae08']
            };
            var pfs = pfMap[domEl3] || pfMap['\u91d1'];
            for(var pi=0; pi<pfs.length; pi++) sessionStorage.setItem('nkai_pay_pf'+(pi+1), pfs[pi]);
        })();

        // ══════════════════════════════════════════════════════════════

        // 골든타임 캘린더 렌더링
        if(vCore.goldenCalendar) {
            var gcArr   = vCore.goldenCalendar;
            var bestGC  = gcArr.slice().sort(function(a,b){ return (b.goldenScore||3)-(a.goldenScore||3); })[0];
            var teaserEl = document.getElementById('golden-teaser-text');
            if(teaserEl && bestGC) {
                teaserEl.textContent = '\u2728 12\uac1c\uc6d4 \uace8\ub4e0\ud0c0\uc784 \ubd84\uc11d \uc644\ub8cc \u2014 BEST: ' + bestGC.monthName + ' ' + bestGC.goldenStars;
            }
            var isUnlocked = sessionStorage.getItem('nkai_golden_unlocked') === '1'
                          || sessionStorage.getItem('nkai_lite_unlocked')   === '1'
                          || sessionStorage.getItem('nkai_standard_unlocked') === '1';
            if(isUnlocked) {
                var lockedEl   = document.getElementById('golden-locked-section');
                var unlockedEl = document.getElementById('golden-unlocked-section');
                if(lockedEl)   lockedEl.style.display   = 'none';
                if(unlockedEl) unlockedEl.style.display  = '';
                if(typeof window.renderGoldenCalendarTiered === 'function') {
                    window.renderGoldenCalendarTiered(gcArr);
                } else if(typeof window.renderGoldenCalendar === 'function') {
                    window.renderGoldenCalendar(gcArr);
                }
            }
        }

        // 나침반 방향
        var dirs = {'\u6728':135, '\u706b':180, '\u571f':225, '\u91d1':315, '\u6c34':45};
        var arr  = document.getElementById('compass-arrow');
        if(arr) arr.style.transform = 'translate(-50%,-50%) rotate(' + (dirs[vCore.dayElement] || 0) + 'deg)';

        generateInsight();

    }, 2800);
}

// 골든타임 캘린더 렌더링
function renderGoldenCalendar(goldenCalendar) {
    var grid = document.getElementById('golden-calendar-grid');
    if(!grid || !goldenCalendar) return;

    var scoreColors = { 5:'#00D68F', 4:'#82e0aa', 3:'#2D8CFF', 2:'#f5b041', 1:'#FF4D6A' };
    var html = '';
    for(var mi=0; mi<goldenCalendar.length; mi++) {
        var m     = goldenCalendar[mi];
        var color = scoreColors[m.goldenScore] || '#2D8CFF';
        html += '<div class="text-center p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform"' +
                ' style="background:' + color + '20;border:1px solid ' + color + '40;" title="' + m.advice + '">' +
                '<div class="text-[10px] text-gray-400">' + m.monthName + '</div>' +
                '<div class="text-xs font-bold" style="color:' + color + ';">' + m.goldenStars + '</div>' +
                '<div class="text-[8px] text-gray-400">' + m.elementKo + '</div>' +
                '</div>';
    }
    grid.innerHTML = html;
}

function renderXAIPanel(vCore, vBehavior, vFused, code) {
    /* ★ v2.4: strengthIndex 임계값 수정 (범위: -0.4~+0.3, 판정: ±0.15) */
    var sLabel = vCore.strengthIndex > 0.15 ? '\uac15' : (vCore.strengthIndex < -0.15 ? '\uc57d' : '\uade0\ud615');
    var sColor = vCore.strengthIndex > 0.15 ? '#00D68F' : (vCore.strengthIndex < -0.15 ? '#FF6B6B' : '#FFD93D');

    var coreEl = document.getElementById('xai-core-factors');
    if(coreEl) {
        coreEl.innerHTML =
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">\uae30\uc9c8</p><p class="text-white font-bold text-xs">' + vCore.dayElement + '</p></div>' +
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">\uc5d0\ub108\uc9c0</p><p class="font-bold text-xs" style="color:' + sColor + '">' + sLabel + '</p></div>' +
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">\uacbd\uc81c\uac10\uac01</p><p class="text-white font-bold text-xs">' + (vCore.wealthScore*100).toFixed(0) + '%</p></div>' +
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">\ud45c\ud604\ub825</p><p class="text-white font-bold text-xs">' + ((vCore.expressionScore||0)*100).toFixed(0) + '%</p></div>';
    }

    /* ★ v2.4: 최종 아키타입 code에서 직접 분리 */
    var kipaEl = document.getElementById('xai-kipa-factors');
    if(kipaEl) {
        var c0 = code.charAt(0)||'E', c1 = code.charAt(1)||'N', c2 = code.charAt(2)||'T', c3 = code.charAt(3)||'J';
        kipaEl.innerHTML =
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">E/I</p><p class="text-white font-bold text-xs">' + c0 + '</p></div>' +
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">N/S</p><p class="text-white font-bold text-xs">' + c1 + '</p></div>' +
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">T/F</p><p class="text-white font-bold text-xs">' + c2 + '</p></div>' +
            '<div class="bg-black/40 rounded p-1.5 text-center"><p class="text-[9px] text-gray-400">J/P</p><p class="text-white font-bold text-xs">' + c3 + '</p></div>';
    }

    var calEl = document.getElementById('xai-calibration-desc');
    if(calEl) calEl.innerText = '\uae30\uc9c8(' + vCore.dayElement + '/' + sLabel + ') \u00d7 \ud589\ub3d9(' + code + ') \u2192 \uacf5\uba85/\ucda9\ub3cc \ubcf4\uc815 \u2192 \ucd5c\uc885 ' + code;
}

function generateInsight() {
    var insights = [
        "3\uac1c\uc6d4 \ub0b4 \uc608\uc0c1\uce58 \ubabb\ud55c \uae30\ud68c\uac00 \ub3c4\ub798\ud569\ub2c8\ub2e4. \uc18c\uc561 \ud3ec\uc9c0\uc158\uc744 \ubbf8\ub9ac \ud655\ubcf4\ud558\uc138\uc694.",
        "\ud604\uc7ac \uc18c\ube44 \ud328\ud134\uc744 \uc720\uc9c0\ud558\uba74 1\ub144 \ud6c4 \uc790\uc0b0\uc774 12% \uc99d\uac00\ud569\ub2c8\ub2e4.",
        "\uacf3 \uc911\uc694\ud55c \ud22c\uc790 \uae30\ud68c\uac00 \uc635\ub2c8\ub2e4. \ud604\uae08 \uc720\ub3d9\uc131\uc744 \ud655\ubcf4\ud558\uc138\uc694.",
        "\uacfc\uac70\uc758 \uc778\uc5f0\uc774 \uc0c8\ub85c\uc6b4 \ube44\uc988\ub2c8\uc2a4 \uae30\ud68c\ub97c \uac00\uc838\uc62c \uac83\uc785\ub2c8\ub2e4.",
        "\uc5d0\ub108\uc9c0 \ubc38\ub7f0\uc2a4 \ucd5c\uc801\ud654 \uc2dc \uc758\uc0ac\uacb0\uc815 \uc815\ud655\ub3c4\uac00 23% \ud5a5\uc0c1\ub429\ub2c8\ub2e4."
    ];
    var el = document.getElementById('kai-prophecy-text');
    if(el) { el.innerHTML = insights[Math.floor(Math.random()*insights.length)]; el.classList.add('text-white'); }
}
