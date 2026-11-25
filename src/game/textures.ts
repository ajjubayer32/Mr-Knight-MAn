import * as THREE from 'three';

export interface ProceduralTexturePack {
  road: THREE.CanvasTexture;
  intersectionRoad: THREE.CanvasTexture;
  zebraCrossing: THREE.CanvasTexture;
  standBay: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  curb: THREE.CanvasTexture;
  rickshawArt: THREE.CanvasTexture[]; // 5 character liveries
  rickshawArtAlt: THREE.CanvasTexture[];
  canopyPattern: THREE.CanvasTexture[]; // 5 character liveries
  canopyAlt: THREE.CanvasTexture[];
  shopSigns: THREE.CanvasTexture[];
  landmarkSigns: Record<'ganginarpar' | 'townhall' | 'bridge' | 'charpara', THREE.CanvasTexture>;
  busSide: THREE.CanvasTexture[];
  busFront: THREE.CanvasTexture;
  buildingFacades: THREE.CanvasTexture[];
  contactShadow: THREE.CanvasTexture;
  takaCoin: THREE.CanvasTexture;
  busStopSign: THREE.CanvasTexture;
  speedLimitSign: THREE.CanvasTexture;
  waterRipples: THREE.CanvasTexture;
  dispose: () => void;
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Realistic weathered urban asphalt
  ctx.fillStyle = '#33363b';
  ctx.fillRect(0, 0, w, h);

  // Fine aggregate stone & tarmac grit
  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = 40 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 2})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Darker worn tire-track bands
  const laneCenters = [w * 0.16, w * 0.38, w * 0.62, w * 0.84];
  for (const cx of laneCenters) {
    const grad = ctx.createLinearGradient(cx - 58, 0, cx + 58, 0);
    grad.addColorStop(0, 'rgba(18,19,22,0)');
    grad.addColorStop(0.28, 'rgba(18,19,22,0.26)');
    grad.addColorStop(0.5, 'rgba(26,27,30,0.08)');
    grad.addColorStop(0.72, 'rgba(18,19,22,0.26)');
    grad.addColorStop(1, 'rgba(18,19,22,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 58, 0, 116, h);
  }

  // Natural tar patches & weathered surface repairs
  const patches = [
    [160, 140, 92, 165],
    [710, 580, 74, 128],
    [410, 790, 86, 95],
    [250, 520, 48, 76],
  ];
  for (const [px, py, pw, ph] of patches) {
    ctx.fillStyle = 'rgba(24,25,28,0.48)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(15,16,18,0.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
  }

  // Thin weathered cracks
  ctx.strokeStyle = 'rgba(18,19,21,0.52)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 380);
  ctx.lineTo(225, 430);
  ctx.lineTo(210, 495);
  ctx.moveTo(780, 160);
  ctx.lineTo(820, 225);
  ctx.stroke();

  // Dusty sandy shoulders along road edges
  const leftDust = ctx.createLinearGradient(0, 0, 84, 0);
  leftDust.addColorStop(0, 'rgba(158,136,108,0.56)');
  leftDust.addColorStop(1, 'rgba(158,136,108,0)');
  ctx.fillStyle = leftDust;
  ctx.fillRect(0, 0, 84, h);

  const rightDust = ctx.createLinearGradient(w - 84, 0, w, 0);
  rightDust.addColorStop(0, 'rgba(158,136,108,0)');
  rightDust.addColorStop(1, 'rgba(158,136,108,0.56)');
  ctx.fillStyle = rightDust;
  ctx.fillRect(w - 84, 0, 84, h);

  // Outer faded white lines
  ctx.fillStyle = 'rgba(232, 228, 216, 0.78)';
  ctx.fillRect(42, 0, 12, h);
  ctx.fillRect(w - 54, 0, 12, h);

  // Center double yellow-amber divider
  ctx.fillStyle = 'rgba(226, 172, 46, 0.85)';
  ctx.fillRect(w / 2 - 14, 0, 9, h);
  ctx.fillRect(w / 2 + 5, 0, 9, h);

  // Dashed lane dividers
  ctx.fillStyle = 'rgba(238, 236, 228, 0.78)';
  const dashCount = 4;
  const seg = h / dashCount;
  for (let i = 0; i < dashCount; i++) {
    const y = i * seg + 28;
    ctx.fillRect(w * 0.27 - 5, y, 10, seg * 0.5);
    ctx.fillRect(w * 0.73 - 5, y, 10, seg * 0.5);
  }

  return finalizeTexture(canvas, maxAnisotropy, 1, 1);
}

function createIntersectionTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#313439';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 8500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 39 + Math.floor(Math.random() * 32);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 2})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle weathered turning tire tracks in center of intersection
  ctx.strokeStyle = 'rgba(18, 19, 22, 0.24)';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.36, 0, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size, 0, size * 0.36, Math.PI * 0.5, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, size, size * 0.36, -Math.PI * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size, size, size * 0.36, Math.PI, Math.PI * 1.5);
  ctx.stroke();

  // Subtle faded roundabout / center junction ring
  ctx.strokeStyle = 'rgba(232, 184, 64, 0.45)';
  ctx.lineWidth = 5;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  return finalizeTexture(canvas, maxAnisotropy);
}

function createZebraTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 128);

  ctx.fillStyle = 'rgba(238, 234, 224, 0.82)';
  for (let x = 20; x < 490; x += 48) {
    ctx.fillRect(x, 12, 26, 104);
  }
  return finalizeTexture(canvas, maxAnisotropy);
}

function createStandBayTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 512);

  // Yellow dashed CNG / Rickshaw stand boundary
  ctx.strokeStyle = 'rgba(245, 184, 28, 0.88)';
  ctx.lineWidth = 10;
  ctx.setLineDash([28, 18]);
  ctx.strokeRect(12, 12, 232, 488);

  ctx.setLineDash([]);
  ctx.save();
  ctx.translate(128, 256);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(245, 184, 28, 0.86)';
  ctx.font = 'bold 34px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('রিকশা · CNG স্ট্যান্ড', 0, 0);
  ctx.restore();

  return finalizeTexture(canvas, maxAnisotropy);
}

function createSidewalkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#9e8974';
  ctx.fillRect(0, 0, 512, 512);

  const bw = 64;
  const bh = 32;
  for (let row = 0; row < 512 / bh; row++) {
    const offset = (row % 2) * (bw / 2);
    for (let col = -1; col < 512 / bw + 1; col++) {
      const x = col * bw + offset;
      const y = row * bh;
      const shade = 142 + ((row * 7 + col * 13) % 30);
      ctx.fillStyle = `rgb(${shade}, ${shade - 16}, ${shade - 30})`;
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    }
  }

  return finalizeTexture(canvas, maxAnisotropy, 1, 4);
}

function createCurbTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const blockH = 128;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#be372f' : '#e2dcd0';
    ctx.fillRect(0, i * blockH, 256, blockH);
    ctx.fillStyle = 'rgba(30,25,20,0.22)';
    ctx.fillRect(0, i * blockH + blockH - 8, 256, 8);
  }

  return finalizeTexture(canvas, maxAnisotropy, 1, 4);
}

function createRickshawArtTexture(
  maxAnisotropy: number,
  bgHex: string,
  accentHex: string,
  titleBangla: string,
  motif: 'boat' | 'flower' | 'bridge' | 'rose' | 'heritage' = 'boat'
): THREE.CanvasTexture {
  const w = 512;
  const h = 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#ffd12a';
  ctx.lineWidth = 18;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(26, 26, w - 52, h - 52);

  const corners = [
    [46, 46],
    [w - 46, 46],
    [46, h - 46],
    [w - 46, h - 46],
  ];
  for (const [cx, cy] of corners) {
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2;
      ctx.fillStyle = p % 2 === 0 ? accentHex : '#ffd12a';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const midX = w / 2;
  const midY = h / 2 + 8;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(midX, midY, 155, 108, 0, 0, Math.PI * 2);
  ctx.clip();

  if (motif === 'boat') {
    const sky = ctx.createLinearGradient(0, midY - 108, 0, midY + 30);
    sky.addColorStop(0, '#1a237e');
    sky.addColorStop(0.5, '#ff6f00');
    sky.addColorStop(1, '#ffd54f');
    ctx.fillStyle = sky;
    ctx.fillRect(midX - 160, midY - 110, 320, 140);
    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(midX, midY - 12, 34, 0, Math.PI * 2);
    ctx.fill();
    const river = ctx.createLinearGradient(0, midY + 12, 0, midY + 110);
    river.addColorStop(0, '#0288d1');
    river.addColorStop(1, '#01579b');
    ctx.fillStyle = river;
    ctx.fillRect(midX - 160, midY + 12, 320, 105);
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(midX - 58, midY + 38);
    ctx.quadraticCurveTo(midX, midY + 62, midX + 58, midY + 38);
    ctx.lineTo(midX + 40, midY + 54);
    ctx.lineTo(midX - 40, midY + 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.moveTo(midX - 4, midY + 36);
    ctx.lineTo(midX - 4, midY - 42);
    ctx.quadraticCurveTo(midX + 44, midY - 12, midX + 28, midY + 34);
    ctx.closePath();
    ctx.fill();
  } else if (motif === 'flower') {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(midX - 160, midY - 110, 320, 220);
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.ellipse(midX, midY + 56, 130, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let k = -3; k <= 3; k++) {
      ctx.fillStyle = k % 2 === 0 ? '#f43f5e' : '#fef08a';
      ctx.beginPath();
      ctx.ellipse(midX + k * 20, midY + 18 - Math.abs(k) * 4, 14, 38, k * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(midX, midY + 16, 16, 44, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (motif === 'bridge') {
    const sky = ctx.createLinearGradient(0, midY - 108, 0, midY + 30);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(midX - 160, midY - 110, 320, 145);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(midX - 160, midY + 25, 320, 95);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(midX - 65, midY + 26, 62, Math.PI, 0);
    ctx.arc(midX + 65, midY + 26, 62, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(midX - 155, midY + 18, 310, 10);
  } else if (motif === 'rose') {
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(midX - 160, midY - 110, 320, 220);
    for (let ring = 3; ring >= 1; ring--) {
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2 + ring * 0.4;
        ctx.fillStyle = ring === 1 ? '#fde047' : ring === 2 ? '#fb7185' : '#e11d48';
        ctx.beginPath();
        ctx.arc(midX + Math.cos(a) * ring * 18, midY + Math.sin(a) * ring * 14, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(midX, midY, 16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Heritage Town Hall red-brick archways
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(midX - 160, midY - 110, 320, 220);
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(midX - 115, midY - 20, 230, 110);
    ctx.fillStyle = '#fef3c7';
    for (const ax of [midX - 70, midX, midX + 70]) {
      ctx.beginPath();
      ctx.arc(ax, midY + 30, 22, Math.PI, 0);
      ctx.lineTo(ax + 22, midY + 90);
      ctx.lineTo(ax - 22, midY + 90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#15803d';
    ctx.fillRect(midX - 160, midY + 82, 320, 34);
  }
  ctx.restore();

  ctx.strokeStyle = '#ffd12a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(midX, midY, 155, 108, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.fillRect(92, 32, w - 184, 46);
  ctx.strokeStyle = '#ffd12a';
  ctx.lineWidth = 3;
  ctx.strokeRect(92, 32, w - 184, 46);

  ctx.fillStyle = '#fffde7';
  ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleBangla, midX, 56);

  ctx.fillStyle = '#ffffff';
  for (let x = 76; x <= w - 76; x += 24) {
    ctx.beginPath();
    ctx.arc(x, h - 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(canvas, maxAnisotropy);
}

function createCanopyPatternTexture(
  maxAnisotropy: number,
  primary: string,
  secondary: string,
  trim: string,
  patternStyle: number = 0
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 512, 512);

  if (patternStyle === 1) {
    // Diagonal chevron / diamond bands
    ctx.fillStyle = secondary;
    for (let x = 0; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 120);
      ctx.lineTo(x + 32, 180);
      ctx.lineTo(x + 64, 120);
      ctx.lineTo(x + 32, 60);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(0, 290, 512, 92);
  } else if (patternStyle === 2) {
    // Twin racing stripes + wave border
    ctx.fillStyle = secondary;
    ctx.fillRect(0, 140, 512, 120);
    ctx.fillStyle = trim;
    ctx.fillRect(0, 126, 512, 14);
    ctx.fillRect(0, 260, 512, 14);
    ctx.fillRect(0, 350, 512, 26);
  } else {
    ctx.fillStyle = secondary;
    ctx.fillRect(0, 128, 512, 96);
    ctx.fillRect(0, 320, 512, 84);
  }

  ctx.fillStyle = trim;
  ctx.fillRect(0, 114, 512, 12);
  ctx.fillRect(0, 224, 512, 12);
  ctx.fillRect(0, 306, 512, 12);
  ctx.fillRect(0, 404, 512, 12);

  for (let x = 48; x < 512; x += 96) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, 176, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.arc(x, 176, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(canvas, maxAnisotropy);
}

function createShopSignTextures(maxAnisotropy: number): THREE.CanvasTexture[] {
  const signs: Array<{
    bg: string;
    border: string;
    text: string;
    bangla: string;
    sub: string;
  }> = [
    { bg: '#b91c1c', border: '#ffd54f', text: '#ffffff', bangla: 'হোটেল আমির ইন্টাঃ', sub: 'MYMENSINGH HOTEL & BIRYANI' },
    { bg: '#1565c0', border: '#ffffff', text: '#ffffff', bangla: 'চরপাড়া মেডিকেল ফার্মেসি', sub: '24H PHARMACY · MYMENSINGH' },
    { bg: '#00695c', border: '#ffd54f', text: '#fffde7', bangla: 'মায়ের দোয়া চা স্টল', sub: 'FRESH CHA · SINGARA · PURI' },
    { bg: '#db2777', border: '#ffffff', text: '#ffffff', bangla: 'বিকাশ ও মোবাইল ব্যাংকিং', sub: 'GANGINARPAR AGENT POINT' },
    { bg: '#1e7e34', border: '#ffeb3b', text: '#ffffff', bangla: 'গাঙ্গিনারপাড় বস্ত্রালয়', sub: 'SAREE · PANJABI · CLOTHING' },
    { bg: '#4e342e', border: '#ffb300', text: '#fff8e1', bangla: 'টাউন হল বুক ডিপো', sub: 'BOOKS · STATIONERY · OFFICE' },
    { bg: '#ea580c', border: '#1e293b', text: '#ffffff', bangla: 'ব্রহ্মপুত্র ইলেকট্রনিক্স', sub: 'HARDWARE · FAN · REPAIR' },
    { bg: '#6d28d9', border: '#ffd54f', text: '#ffffff', bangla: 'ময়মনসিংহ মিষ্টান্ন ভান্ডার', sub: 'MANDA · SWEETS · BAKERY' },
  ];

  return signs.map((s) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, 512, 192);

    ctx.strokeStyle = s.border;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 176);

    ctx.fillStyle = s.text;
    ctx.font = 'bold 42px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.bangla, 256, 76);

    ctx.fillStyle = s.border;
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(s.sub, 256, 138);

    return finalizeTexture(canvas, maxAnisotropy);
  });
}

function createLandmarkSigns(maxAnisotropy: number) {
  const makeBanner = (bg: string, bangla: string, english: string, sub: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 768, 256);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 744, 232);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 54px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bangla, 384, 82);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Bricolage Grotesque", sans-serif';
    ctx.fillText(english, 384, 152);

    ctx.fillStyle = '#d1fae5';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(sub, 384, 206);

    return finalizeTexture(canvas, maxAnisotropy);
  };

  return {
    ganginarpar: makeBanner('#065f46', 'গাঙ্গিনারপাড় মোড়', 'GANGINARPAR · MYMENSINGH', 'Commercial Hub · Mymensingh City'),
    townhall: makeBanner('#1e3a8a', 'টাউন হল রোড', 'TOWN HALL ROAD · MYMENSINGH', 'Heritage Avenue · Zila School Gate'),
    bridge: makeBanner('#0f766e', 'শম্ভুগঞ্জ ব্রিজ', 'SHAMBHUGANJ BRIDGE', 'Brahmaputra River Crossing · Mymensingh'),
    charpara: makeBanner('#7c2d12', 'চরপাড়া ও স্টেশন রোড', 'CHARPARA · STATION ROAD', 'Medical More & Bus Stand · Mymensingh'),
  };
}

function createBusTextures(maxAnisotropy: number): {
  busSide: THREE.CanvasTexture[];
  busFront: THREE.CanvasTexture;
} {
  const liveries = [
    { body: '#1b6e3c', stripe: '#f5b700', name: 'ময়মনসিংহ ⇄ শম্ভুগঞ্জ' },
    { body: '#b82925', stripe: '#f7f4eb', name: 'সৌখিন এক্সপ্রেস · ময়মনসিংহ' },
    { body: '#15549a', stripe: '#ff8f00', name: 'এনা / ইসলাম পরিবহন' },
  ];

  const busSide = liveries.map((liv) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = liv.body;
    ctx.fillRect(0, 0, 1024, 384);

    ctx.fillStyle = liv.stripe;
    ctx.fillRect(0, 210, 1024, 48);

    ctx.fillStyle = '#1f2933';
    ctx.fillRect(36, 48, 940, 132);

    ctx.fillStyle = liv.body;
    for (let x = 148; x < 950; x += 118) {
      ctx.fillRect(x, 42, 18, 144);
    }

    ctx.fillStyle = 'rgba(180,220,245,0.22)';
    for (let x = 48; x < 940; x += 118) {
      ctx.fillRect(x, 58, 84, 108);
    }

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(liv.name, 512, 234);

    return finalizeTexture(canvas, maxAnisotropy);
  });

  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 512;
  frontCanvas.height = 512;
  const fctx = frontCanvas.getContext('2d')!;
  fctx.fillStyle = '#1f2933';
  fctx.fillRect(0, 0, 512, 512);
  fctx.fillStyle = '#ffd54f';
  fctx.fillRect(38, 26, 436, 72);
  fctx.fillStyle = '#111827';
  fctx.font = 'bold 30px "Hind Siliguri", sans-serif';
  fctx.textAlign = 'center';
  fctx.textBaseline = 'middle';
  fctx.fillText('ময়মনসিংহ ⇄ ঢাকা', 256, 63);

  const busFront = finalizeTexture(frontCanvas, maxAnisotropy);
  return { busSide, busFront };
}

function createBuildingFacades(maxAnisotropy: number): THREE.CanvasTexture[] {
  const palettes = [
    { wall: '#c77d63', trim: '#9c5840', shutter: '#2b4159', brick: true },
    { wall: '#cbd5c0', trim: '#8fa185', shutter: '#2e4756', brick: false },
    { wall: '#e2c79a', trim: '#b08f5d', shutter: '#5e3a2c', brick: false },
    { wall: '#b8cbd8', trim: '#7a95a8', shutter: '#264653', brick: false },
    { wall: '#9f4a3c', trim: '#743127', shutter: '#374151', brick: true }, // Heritage red brick (Town Hall style)
  ];

  return palettes.map((pal) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = pal.wall;
    ctx.fillRect(0, 0, 512, 512);

    if (pal.brick) {
      ctx.fillStyle = 'rgba(70, 25, 18, 0.14)';
      for (let by = 0; by < 340; by += 18) {
        ctx.fillRect(0, by, 512, 2);
      }
    }

    for (let i = 0; i < 48; i++) {
      ctx.fillStyle = 'rgba(40, 34, 28, 0.06)';
      ctx.fillRect(Math.random() * 512, Math.random() * 340, 12 + Math.random() * 26, 40 + Math.random() * 110);
    }

    // Upper floor windows, grilles & AC units
    for (let row = 0; row < 2; row++) {
      const y = 38 + row * 142;
      for (let col = 0; col < 3; col++) {
        const x = 38 + col * 158;
        ctx.fillStyle = pal.trim;
        ctx.fillRect(x - 6, y - 6, 124, 102);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, 112, 90);
        ctx.fillStyle = '#64748b';
        for (let gx = x + 18; gx < x + 110; gx += 22) {
          ctx.fillRect(gx, y, 4, 90);
        }
        ctx.fillRect(x, y + 45, 112, 4);
      }
    }

    // Ground floor commercial shutter
    ctx.fillStyle = pal.shutter;
    ctx.fillRect(26, 348, 460, 164);
    for (let sy = 356; sy < 512; sy += 12) {
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.fillRect(26, sy, 460, 3);
    }

    return finalizeTexture(canvas, maxAnisotropy);
  });
}

function createRoadSignTexture(
  maxAnisotropy: number,
  bg: string,
  title: string,
  sub: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 236, 236);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 128, 104);
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(sub, 128, 182);
  return finalizeTexture(canvas, maxAnisotropy);
}

function createWaterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2d5c6b';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(130, 185, 200, 0.14)' : 'rgba(20, 48, 58, 0.16)';
    ctx.fillRect(Math.random() * 480, Math.random() * 512, 24 + Math.random() * 64, 4);
  }
  return finalizeTexture(canvas, maxAnisotropy, 3, 2);
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(14, 10, 8, 0.72)');
  grad.addColorStop(0.6, 'rgba(14, 10, 8, 0.34)');
  grad.addColorStop(1, 'rgba(14, 10, 8, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createTakaCoinTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 124);
  grad.addColorStop(0, '#ffe082');
  grad.addColorStop(0.75, '#f59e0b');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff8e1';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(128, 128, 102, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 118px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('৳', 128, 134);

  return finalizeTexture(canvas, maxAnisotropy);
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTexturePack {
  const road = createRoadTexture(maxAnisotropy);
  const intersectionRoad = createIntersectionTexture(maxAnisotropy);
  const zebraCrossing = createZebraTexture(maxAnisotropy);
  const standBay = createStandBayTexture(maxAnisotropy);
  const sidewalk = createSidewalkTexture(maxAnisotropy);
  const curb = createCurbTexture(maxAnisotropy);

  const rickshawArt = [
    createRickshawArtTexture(maxAnisotropy, '#0a5e48', '#ff2e79', 'মায়ের দোয়া', 'boat'),
    createRickshawArtTexture(maxAnisotropy, '#8b1515', '#fde047', 'শাপলা এক্সপ্রেস', 'flower'),
    createRickshawArtTexture(maxAnisotropy, '#153a9e', '#38bdf8', 'ময়মনসিংহ সুন্দরী', 'bridge'),
    createRickshawArtTexture(maxAnisotropy, '#58153d', '#fb7185', 'সোনার বাংলা', 'rose'),
    createRickshawArtTexture(maxAnisotropy, '#9a3412', '#2dd4bf', 'ব্রহ্মপুত্র তীরে', 'heritage'),
  ];
  const rickshawArtAlt = [
    createRickshawArtTexture(maxAnisotropy, '#c62828', '#29b6f6', 'সোনার বাংলা', 'boat'),
    createRickshawArtTexture(maxAnisotropy, '#1565c0', '#ff4081', 'গাঙ্গিনারপাড়', 'flower'),
    createRickshawArtTexture(maxAnisotropy, '#2e7d32', '#ffca28', 'আল্লাহ ভরসা', 'heritage'),
  ];

  const canopyPattern = [
    createCanopyPatternTexture(maxAnisotropy, '#0b664f', '#b91c1c', '#ffd12a', 0),
    createCanopyPatternTexture(maxAnisotropy, '#991b1b', '#f59e0b', '#fef08a', 1),
    createCanopyPatternTexture(maxAnisotropy, '#1d4ed8', '#06b6d4', '#ffffff', 2),
    createCanopyPatternTexture(maxAnisotropy, '#6d1b4b', '#ec4899', '#fde047', 1),
    createCanopyPatternTexture(maxAnisotropy, '#c2410c', '#0f766e', '#fef3c7', 2),
  ];
  const canopyAlt = [
    createCanopyPatternTexture(maxAnisotropy, '#1565c0', '#ff8f00', '#ffffff', 0),
    createCanopyPatternTexture(maxAnisotropy, '#00695c', '#d81b60', '#ffeb3b', 1),
    createCanopyPatternTexture(maxAnisotropy, '#ad1457', '#2e7d32', '#ffe082', 2),
  ];

  const shopSigns = createShopSignTextures(maxAnisotropy);
  const landmarkSigns = createLandmarkSigns(maxAnisotropy);
  const { busSide, busFront } = createBusTextures(maxAnisotropy);
  const buildingFacades = createBuildingFacades(maxAnisotropy);
  const contactShadow = createContactShadowTexture();
  const takaCoin = createTakaCoinTexture(maxAnisotropy);
  const busStopSign = createRoadSignTexture(maxAnisotropy, '#1d4ed8', 'বাস', 'BUS STOP');
  const speedLimitSign = createRoadSignTexture(maxAnisotropy, '#b91c1c', '৪০', 'SPEED LIMIT');
  const waterRipples = createWaterTexture(maxAnisotropy);

  return {
    road,
    intersectionRoad,
    zebraCrossing,
    standBay,
    sidewalk,
    curb,
    rickshawArt,
    rickshawArtAlt,
    canopyPattern,
    canopyAlt,
    shopSigns,
    landmarkSigns,
    busSide,
    busFront,
    buildingFacades,
    contactShadow,
    takaCoin,
    busStopSign,
    speedLimitSign,
    waterRipples,
    dispose: () => {
      [
        road,
        intersectionRoad,
        zebraCrossing,
        standBay,
        sidewalk,
        curb,
        ...rickshawArt,
        ...rickshawArtAlt,
        ...canopyPattern,
        ...canopyAlt,
        ...shopSigns,
        ...Object.values(landmarkSigns),
        ...busSide,
        busFront,
        ...buildingFacades,
        contactShadow,
        takaCoin,
        busStopSign,
        speedLimitSign,
        waterRipples,
      ].forEach((t) => t.dispose());
    },
  };
}
