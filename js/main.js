// ==========================================
// UTILITY
// ==========================================
function showPage(id) { document.querySelectorAll('.page-section').forEach(function(el) { el.classList.remove('active'); }); document.getElementById(id).classList.add('active'); window.scrollTo(0,0); }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

// 결과 화면 탭 전환
function showResultTab(tabName) {
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.result-tab-content').forEach(function(el) { el.classList.add('hidden'); });
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.result-tab-btn').forEach(function(btn) {
        btn.classList.remove('bg-[#2D8CFF]/20', 'text-[#2D8CFF]', 'border-[#2D8CFF]/30');
        btn.classList.add('bg-white/5', 'text-gray-400', 'border-white/10');
    });
    // 선택된 탭 콘텐츠 표시
    var tabContent = document.getElementById('result-tab-' + tabName);
    if(tabContent) tabContent.classList.remove('hidden');
    // 선택된 탭 버튼 활성화
    var tabBtn = document.getElementById('tab-' + tabName);
    if(tabBtn) {
        tabBtn.classList.remove('bg-white/5', 'text-gray-400', 'border-white/10');
        tabBtn.classList.add('bg-[#2D8CFF]/20', 'text-[#2D8CFF]', 'border-[#2D8CFF]/30');
    }
}
