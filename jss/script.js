/* การตั้งค่า Firebase */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCtpuArW_VhP4Q-UNlMJ-6M8lot19gi8k8",
  authDomain: "kimoo-dfbef.firebaseapp.com",
  databaseURL: "https://kimoo-dfbef-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kimoo-dfbef",
  storageBucket: "kimoo-dfbef.firebasestorage.app",
  messagingSenderId: "864165516996",
  appId: "1:864165516996:web:33cb20b8670d2e38335b91",
  measurementId: "G-DZEM9T87ZD"
};

const PLACEHOLDER_LOGO = "https://placehold.co/300x300/1e293b/f97316?text=ESPORTS+LOGO";

const THEMES = {
  orange: {
    id: 'orange',
    name: 'ส้ม (Orange)',
    btnClass: 'border-[#ff6d00] bg-[#ff6d00] text-white',
    bannerBg: 'bg-[#11141c] border-[#ff6d00]',
    line1Color: 'text-white',
    line2Color: 'text-[#ff6d00]',
    badgeBg: 'bg-[#ff6d00] border-[#ff6d00] text-[#ff6d00] animate-glow-effect',
    badgeText: 'text-white'
  },
  darkblue: {
    id: 'darkblue',
    name: 'น้ำเงิน (Blue)',
    btnClass: 'border-[#4a2aff] bg-[#4a2aff] text-white',
    bannerBg: 'bg-[#11141c] border-[#4a2aff]',
    line1Color: 'text-white',
    line2Color: 'text-[#4a2aff]',
    badgeBg: 'bg-[#4a2aff] border-[#4a2aff] text-[#4a2aff] animate-glow-effect',
    badgeText: 'text-white'
  },
  pink: {
    id: 'pink',
    name: 'ชมพู (Pink)',
    btnClass: 'border-[#ff64db] bg-[#ff64db] text-white',
    bannerBg: 'bg-[#11141c] border-[#ff64db]',
    line1Color: 'text-white',
    line2Color: 'text-[#ff64db]',
    badgeBg: 'bg-[#ff64db] border-[#ff64db] text-[#ff64db] animate-glow-effect',
    badgeText: 'text-white'
  },
  darkgreen: {
    id: 'darkgreen',
    name: 'เขียวเข้ม (Dark Green)',
    btnClass: 'border-[#008000] bg-[#008000] text-white',
    bannerBg: 'bg-[#11141c] border-[#008000]',
    line1Color: 'text-white',
    line2Color: 'text-[#008000]',
    badgeBg: 'bg-[#008000] border-[#008000] text-[#008000] animate-glow-effect',
    badgeText: 'text-white'
  },
  navyBlue: {
    id: 'navyBlue',
    name: 'กรมท่า (Navy Blue)',
    btnClass: 'border-[#1a237e] bg-[#1a237e] text-white',
    bannerBg: 'bg-[#11141c] border-[#1a237e]',
    line1Color: 'text-white',
    line2Color: 'text-[#1a237e]',
    badgeBg: 'bg-[#1a237e] border-[#1a237e] text-[#1a237e] animate-glow-effect',
    badgeText: 'text-white'
  },
  red: {
    id: 'red',
    name: 'แดง (Red)',
    btnClass: 'border-[#FF0000] bg-[#FF0000] text-white',
    bannerBg: 'bg-[#11141c] border-[#FF0000]',
    line1Color: 'text-white',
    line2Color: 'text-[#FF0000]',
    badgeBg: 'bg-[#FF0000] border-[#FF0000] text-[#FF0000] animate-glow-effect',
    badgeText: 'text-white'
  }
};

const DEFAULT_CONFIG = {
  line1: "AXSORA",
  line2: "E-SPORT",
  booyah: "BOOYAH!",
  logoUrl: PLACEHOLDER_LOGO,
  theme: "orange"
};

/* เริ่มต้นเชื่อมต่อ Firebase */
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}
const db = firebase.database();
const dbRef = db.ref("esports_obs_config");
const historyDbRef = db.ref("esports_logo_history");

let cachedHistory = [];

window.addEventListener('DOMContentLoaded', () => {
  renderThemeButtons();
  setupDragAndDrop();
  
  const urlParams = new URLSearchParams(window.location.search);
  const isObsMode = urlParams.get('mode') === 'display' || urlParams.get('obs') === '1';

  if (isObsMode) {
    switchView('display');
  } else {
    loadConfigFromStorage();
    updateObsLink();
  }

  /* Realtime Sync ผ่าน Firebase สำหรับแบนเนอร์และประวัติโลโก้ */
  setupFirebaseRealtimeListener();
  setupFirebaseHistoryListener();
});

function setupFirebaseRealtimeListener() {
  dbRef.on('value', (snapshot) => {
    const config = snapshot.val();
    if (config) {
      renderBanner('obs-banner-wrapper', config, true);
      renderBanner('mini-preview-container', config, false);

      const activeEl = document.activeElement;
      const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (!isUserTyping) {
        localStorage.setItem('esports_obs_config', JSON.stringify(config));
        syncFormFieldsWithConfig(config);
      }
    } else {
      saveState(DEFAULT_CONFIG);
    }
  });
}

function setupFirebaseHistoryListener() {
  historyDbRef.on('value', (snapshot) => {
    const history = snapshot.val();
    if (Array.isArray(history)) {
      cachedHistory = history;
    } else if (history && typeof history === 'object') {
      cachedHistory = Object.values(history);
    } else {
      cachedHistory = [];
    }
    renderLogoHistoryUI();
  });
}

/* ระบบ Drag and Drop รูปภาพ */
function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('input-file-logo');
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drop-zone-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drop-zone-active');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  });
}

function processImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น!');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('input-logo-url').value = dataUrl;
    addToLogoHistory(dataUrl);
    handleInputLiveUpdate();
  };
  reader.readAsDataURL(file);
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    processImageFile(file);
  }
}

function saveState(config) {
  try {
    dbRef.set(config);
    localStorage.setItem('esports_obs_config', JSON.stringify(config));
  } catch (e) {
    console.error("Firebase save failed", e);
  }
}

function handleInputLiveUpdate() {
  const config = getCurrentFormConfig();
  saveState(config);
  updateObsLink();
  renderMiniPreview();
}

function syncFormFieldsWithConfig(config) {
  if (!document.getElementById('input-team-line1')) return;
  document.getElementById('input-team-line1').value = config.line1 !== undefined ? config.line1 : DEFAULT_CONFIG.line1;
  document.getElementById('input-team-line2').value = config.line2 !== undefined ? config.line2 : DEFAULT_CONFIG.line2;
  document.getElementById('input-booyah').value = config.booyah || DEFAULT_CONFIG.booyah;
  document.getElementById('input-logo-url').value = config.logoUrl || DEFAULT_CONFIG.logoUrl;
  selectTheme(config.theme || DEFAULT_CONFIG.theme, false);
  updateObsLink();
  renderMiniPreview();
}

function getCurrentFormConfig() {
  return {
    line1: document.getElementById('input-team-line1').value.trim(),
    line2: document.getElementById('input-team-line2').value.trim(),
    booyah: document.getElementById('input-booyah').value.trim() || 'BOOYAH!',
    logoUrl: document.getElementById('input-logo-url').value || PLACEHOLDER_LOGO,
    theme: window.currentSelectedTheme || 'orange'
  };
}

function getConfigFromStorage() {
  const saved = localStorage.getItem('esports_obs_config');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return DEFAULT_CONFIG; }
  }
  return DEFAULT_CONFIG;
}

function loadConfigFromStorage() {
  const config = getConfigFromStorage();
  syncFormFieldsWithConfig(config);
}

function renderBanner(containerId, config, animate = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const theme = THEMES[config.theme] || THEMES.orange;
  const animLeft = animate ? 'animate-slide-left' : '';
  const animRight = animate ? 'animate-slide-right' : '';
  const animUp = animate ? 'animate-slide-up' : '';

  const hasTeamText = (config.line1 && config.line1.trim() !== '') || (config.line2 && config.line2.trim() !== '');

  container.innerHTML = `
    <!-- โลโก้ขนาดใหญ่ด้านบน -->
    <div class="mb-3 z-10 ${animUp} flex justify-start">
      <div class="w-64 h-64 bg-white border-4 border-orange-500 rounded-2xl p-2 shadow-2xl overflow-hidden flex items-center justify-center animate-big-logo">
        <img src="${config.logoUrl}" alt="Team Logo" class="w-full h-full object-contain rounded-xl" onerror="this.src='${PLACEHOLDER_LOGO}'">
      </div>
    </div>

    <!-- แถบแบนเนอร์ด้านล่าง -->
    <div class="flex items-center z-20">
      <!-- บล็อกชื่อทีมฝั่งซ้าย -->
      <div class="flex items-center ${theme.bannerBg} border-2 shadow-2xl esport-banner-clip pr-10 pl-3 py-2.5 ${animLeft}">
        <div class="w-12 h-12 bg-white rounded-xl border-2 border-orange-400 p-0.5 flex items-center justify-center ${hasTeamText ? 'mr-3' : 'mr-0'} shrink-0 overflow-hidden shadow-md">
          <img src="${config.logoUrl}" alt="Thumb" class="w-full h-full object-contain rounded-lg" onerror="this.src='${PLACEHOLDER_LOGO}'">
        </div>
        ${hasTeamText ? `
        <div class="flex flex-col mr-2">
          ${config.line1 ? `<span class="${theme.line1Color} font-black text-xl tracking-wider leading-none uppercase drop-shadow">${config.line1}</span>` : ''}
          ${config.line2 ? `<span class="${theme.line2Color} font-bold text-xl tracking-wider leading-none mt-1 uppercase drop-shadow">${config.line2}</span>` : ''}
        </div>
        ` : ''}
      </div>

      <!-- บล็อกป้าย Badge ฝั่งขวา -->
      <div class="${theme.badgeBg} badge-shine-container animate-badge-pulse border-t-2 border-b-2 border-r-2 shadow-2xl esport-booyah-clip px-8 py-3.5 -ml-6 flex items-center justify-center transition-all ${animRight}">
        <span class="${theme.badgeText} font-black italic text-3xl tracking-tighter uppercase relative z-10" style="font-style: italic; font-weight: 900; text-shadow: 2px 2px 4px rgba(0,0,0,0.6);">${config.booyah}</span>
      </div>
    </div>
  `;
}

function renderMiniPreview() {
  renderBanner('mini-preview-container', getCurrentFormConfig(), false);
}

function renderThemeButtons() {
  const container = document.getElementById('theme-selector-container');
  if (!container) return;

  container.innerHTML = Object.keys(THEMES).map(key => {
    const t = THEMES[key];
    return `
      <button type="button" onclick="selectTheme('${t.id}')" id="btn-theme-${t.id}" class="border rounded-xl p-2 text-xs font-bold transition flex items-center justify-center ${t.btnClass} hover:opacity-100 opacity-70">
        <span>${t.name}</span>
      </button>
    `;
  }).join('');
}

function selectTheme(themeId, triggerUpdate = true) {
  Object.keys(THEMES).forEach(key => {
    const btn = document.getElementById(`btn-theme-${key}`);
    if (btn) {
      if (key === themeId) {
        btn.classList.remove('opacity-70');
        btn.classList.add('opacity-100', 'ring-2', 'ring-orange-400');
      } else {
        btn.classList.remove('opacity-100', 'ring-2', 'ring-orange-400');
        btn.classList.add('opacity-70');
      }
    }
  });
  window.currentSelectedTheme = themeId;
  if (triggerUpdate) handleInputLiveUpdate();
}

function switchView(mode) {
  const controlView = document.getElementById('view-control');
  const displayView = document.getElementById('view-display');
  const btnControl = document.getElementById('btn-control');
  const btnDisplay = document.getElementById('btn-display');
  const modeBar = document.getElementById('mode-selector-bar');
  const bodyEl = document.body;

  if (mode === 'display') {
    controlView.classList.add('hidden');
    displayView.classList.remove('hidden');
    modeBar.classList.add('hidden');
    bodyEl.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
  } else {
    displayView.classList.add('hidden');
    controlView.classList.remove('hidden');
    modeBar.classList.remove('hidden');
    bodyEl.style.backgroundColor = '#0b0d12';
    document.documentElement.style.backgroundColor = '#0b0d12';
    
    btnControl.className = "px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-orange-600 text-white shadow-md transition-all flex items-center gap-2";
    btnDisplay.className = "px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-2";
    
    loadConfigFromStorage();
    updateObsLink();
    renderMiniPreview();
  }
}

function setQuickBooyah(text) {
  document.getElementById('input-booyah').value = text;
  handleInputLiveUpdate();
}

function resetDefaults() {
  if (confirm("คุณต้องการรีเซ็ตตั้งค่าข้อความและสีกลับเป็นค่าเริ่มต้นหรือไม่?")) {
    document.getElementById('input-team-line1').value = DEFAULT_CONFIG.line1;
    document.getElementById('input-team-line2').value = DEFAULT_CONFIG.line2;
    document.getElementById('input-booyah').value = DEFAULT_CONFIG.booyah;
    document.getElementById('input-logo-url').value = DEFAULT_CONFIG.logoUrl;
    selectTheme(DEFAULT_CONFIG.theme);
    handleInputLiveUpdate();
    showToast('รีเซ็ตเป็นค่าเริ่มต้นเรียบร้อย!');
  }
}

function updateObsLink() {
  const baseUrl = window.location.origin + window.location.pathname;
  const obsUrl = `${baseUrl}?mode=display`;

  const obsLinkEl = document.getElementById('obs-link-output');
  const openNewTabEl = document.getElementById('open-display-newtab');

  if (obsLinkEl) obsLinkEl.value = obsUrl;
  if (openNewTabEl) openNewTabEl.href = obsUrl;
}

function copyObsLink() {
  const copyText = document.getElementById("obs-link-output");
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(copyText.value).then(() => {
    showToast('คัดลอกลิงก์ OBS เรียบร้อยแล้ว!');
  }).catch(() => {
    document.execCommand('copy');
    showToast('คัดลอกลิงก์ OBS เรียบร้อยแล้ว!');
  });
}

/* จัดการประวัติโลโก้ออนไลน์ (Sync ร่วมกันทุกเครื่อง) */
function addToLogoHistory(logoUrl) {
  if (!logoUrl || logoUrl === PLACEHOLDER_LOGO) return;
  let history = cachedHistory.filter(url => url !== logoUrl);
  history.unshift(logoUrl);
  if (history.length > 8) history = history.slice(0, 8);
  historyDbRef.set(history);
}

function renderLogoHistoryUI() {
  const container = document.getElementById('logo-history-list');
  if (!container) return;

  const currentLogo = document.getElementById('input-logo-url')?.value || '';

  if (cachedHistory.length === 0) {
    container.innerHTML = `<span class="text-[11px] text-slate-600 italic">ยังไม่มีประวัติรูปโลโก้</span>`;
    return;
  }

  container.innerHTML = cachedHistory.map(url => {
    const isSelected = url === currentLogo;
    return `
      <div onclick="selectLogoFromHistory('${encodeURIComponent(url)}')" 
           class="w-10 h-10 rounded-lg bg-slate-900 border-2 ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105' : 'border-slate-700 hover:border-slate-500'} p-0.5 cursor-pointer shrink-0 transition-all flex items-center justify-center overflow-hidden">
        <img src="${url}" class="w-full h-full object-contain rounded" onerror="this.src='${PLACEHOLDER_LOGO}'">
      </div>
    `;
  }).join('');
}

function selectLogoFromHistory(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  document.getElementById('input-logo-url').value = url;
  handleInputLiveUpdate();
}

function clearLogoHistory() {
  if (confirm("คุณต้องการล้างประวัติโลโก้ทั้งหมดในระบบหรือไม่?")) {
    historyDbRef.set([]);
    showToast('ล้างประวัติโลโก้เรียบร้อยแล้ว');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}