// ★ N-KAI N-Score 산출 근거 브레이크다운 v5.0
// N-Score 카드 밖, 3대 지표 바로 위 독립 섹션으로 배치

(function() {

  var _timer = setInterval(function() {
    var sd = document.getElementById('score-display');
    if (!sd || !sd.innerText || sd.innerText === '0') return;
    var finalScore = parseInt(sd.innerText) || 0;
    if (!finalScore) return;
    clearInterval(_timer);
    setTimeout(function(){ _render(finalScore); }, 400);
  }, 300);

  function _computeBehaviorBonus() {
    var sq1 = parseInt(sessionStorage.getItem('nkai_sq1') || localStorage.getItem('nkai_sq1') || '-1');
    var sq2 = parseInt(sessionStorage.getItem('nkai_sq2') || localStorage.getItem('nkai_sq2') || '-1');
    var sq3 = parseInt(sessionStorage.getItem('nkai_sq3') || localStorage.getItem('nkai_sq3') || '-1');
    var sq4 = parseInt(sessionStorage.getItem('nkai_sq4') || localStorage.getItem('nkai_sq4') || '-1');
    if (sq1 < 0 || sq2 < 0) return 0;
    var bonus = 0;
    bonus += ([15,10,5,0][sq2] || 0);
    bonus += ([20,15,8,0][sq4]  || 0);
    bonus += ([15,18,5,8,12][sq3] || 0);
    if (sq4 === 0) bonus += 15;
    if (sq2 === 0 && sq3 <= 1) bonus += 15;
    if (sq1 === 3) bonus += 10;
    return Math.min(150, bonus);
  }

  function _render(finalScore) {
    // 이미 삽입됐으면 스킵
    if (document.getElementById('nscore-breakdown-box')) return;

    // ★ 삽입 위치: 3대 지표 grid 바로 앞 (경제감각 카드 부모)
    var _anchor = document.getElementById('result-wealth-energy');
    if (!_anchor) return;
    // 3대 지표 grid div (result-wealth-energy의 부모의 부모)
    var _grid = _anchor.closest('.grid');
    if (!_grid) return;

    var _nsr    = (window.computedResults && window.computedResults.nScoreResult) || {};
    var _bd     = _nsr.breakdown || {};
    var _bonus  = _nsr.behaviorBonus || _computeBehaviorBonus();
    var _base   = Math.max(0, finalScore - _bonus);

    var _inn   = _bd.innate   || Math.round(_base * 0.52);
    var _kipa  = _bd.kipa     || Math.round(_base * 0.28);
    // _dyn은 나머지로 계산 → 합산이 항상 finalScore와 일치
    var _dyn   = _bd.dynamic  || (_base - _inn - _kipa);
    var _tot   = finalScore || 1; // 전체 기준 = finalScore

    function _p(v)  { return Math.max(2, Math.round(v / _tot * 100)); }
    function _pc(v) { return _p(v) + '%'; }

    var items = [
      { icon:'🧬', label:'DNA가 설계한 나',    sub:'선천 기질 · 코어에너지 · 강약지수',       color:'#7C5BF0', val:_inn  },
      { icon:'🧠', label:'내가 인식하는 나',   sub:'KIPA 행동진단 16문항 · 결단력',            color:'#2D8CFF', val:_kipa },
      { icon:'⚡', label:'공명 · 충돌 · 균형', sub:'선천×후천 공명 · 5-Energy 균형보너스',    color:'#F0C674', val:_dyn  }
    ];

    var rowHtml = '';
    items.forEach(function(it) {
      var bw = _p(it.val);
      rowHtml +=
        '<div style="margin-bottom:14px">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">'
        +   '<span style="font-size:13px;font-weight:700;color:' + it.color + '">' + it.icon + ' ' + it.label + '</span>'
        +   '<div>'
        +     '<span style="font-size:17px;font-weight:900;color:' + it.color + '">' + it.val + '<span style="font-size:10px;color:#64748B">점</span></span>'
        +     '<span style="font-size:11px;color:' + it.color + ';opacity:0.7;margin-left:5px">(' + _pc(it.val) + ')</span>'
        +   '</div>'
        + '</div>'
        + '<div style="font-size:11px;color:#64748B;margin-bottom:6px">' + it.sub + '</div>'
        + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">'
        +   '<div style="height:100%;width:' + bw + '%;background:' + it.color + ';border-radius:4px;transition:width 1.2s ease"></div>'
        + '</div>'
        + '</div>';
    });

    // 💳 지갑이 증명하는 나
    if (_bonus > 0) {
      var bw2 = _p(_bonus);
      rowHtml +=
        '<div style="margin-bottom:14px">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">'
        +   '<span style="font-size:13px;font-weight:700;color:#00D68F">💳 지갑이 증명하는 나</span>'
        +   '<div>'
        +     '<span style="font-size:17px;font-weight:900;color:#00D68F">+' + _bonus + '<span style="font-size:10px;color:#64748B">점</span></span>'
        +     '<span style="font-size:11px;color:#00D68F;opacity:0.7;margin-left:5px">(' + _pc(_bonus) + ')</span>'
        +   '</div>'
        + '</div>'
        + '<div style="font-size:11px;color:#64748B;margin-bottom:6px">소비 행동 패턴 4가지 · 별도 가산 | Phase2 실카드→200점 · Phase3 MyData→300점</div>'
        + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">'
        +   '<div style="height:100%;width:' + bw2 + '%;background:#00D68F;border-radius:4px;transition:width 1.2s ease"></div>'
        + '</div>'
        + '</div>';
    } else {
      rowHtml +=
        '<div style="padding:12px 14px;background:rgba(0,214,143,0.05);border:1px dashed rgba(0,214,143,0.25);border-radius:10px;margin-bottom:14px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center">'
        +   '<div>'
        +     '<div style="font-size:13px;font-weight:700;color:#00D68F;margin-bottom:4px">💳 지갑이 증명하는 나</div>'
        +     '<div style="font-size:11px;color:#475569">소비 행동 패턴 4가지 · 별도 가산</div>'
        +   '</div>'
        +   '<div style="text-align:right">'
        +     '<div style="font-size:11px;color:#00D68F;font-weight:700;background:rgba(0,214,143,0.12);border-radius:6px;padding:3px 8px">+최대 150점</div>'
        +     '<div style="font-size:10px;color:#475569;margin-top:3px">Phase2 200점 · Phase3 300점</div>'
        +   '</div>'
        + '</div>'
        + '</div>';
    }

    var note = _bonus === 0
      ? '💳 <span style="color:#00D68F;font-weight:700">Phase2</span> 마이데이터 카드 연동 시 실거래 반영 → <span style="color:#F0C674;font-weight:700">1000점 만점</span>'
      : '✅ 소비패턴 +' + _bonus + '점 가산 | <span style="color:#F0C674;font-weight:700">Phase2</span> 실카드 교체 → <span style="color:#F0C674;font-weight:700">1000점 만점</span>';

    var box = document.createElement('div');
    box.id = 'nscore-breakdown-box';
    box.style.cssText = 'margin-bottom:16px;background:rgba(0,0,0,0.3);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.08)';
    box.innerHTML =
      '<p style="text-align:center;font-size:10px;color:#475569;letter-spacing:2px;font-weight:700;text-transform:uppercase;margin-bottom:16px">★ N-Score 산출 근거</p>'
      + rowHtml
      + '<div style="padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:11px;color:#475569;text-align:center;line-height:1.7">' + note + '</div>';

    // 3대 지표 grid 바로 앞에 삽입
    _grid.parentNode.insertBefore(box, _grid);
  }

})();
