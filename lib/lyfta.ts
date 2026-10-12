// lib/lyfta.ts - Ánh xạ ảnh minh họa kiểu Lyfta + suy luận nhóm cơ từ tên bài
// Giữ nguyên UI/logic cũ, chỉ thêm nguồn ảnh để danh sách tìm kiếm hiển thị giống Lyfta.

const LYFTA_BASE = 'https://lyfta.app/images/exercises';

// Chuẩn hóa tên bài: bỏ phần tiếng Việt trong ngoặc, bỏ dấu câu, lower-case.
// VD: "Incline Barbell Bench Press (Đẩy ngực trên tạ đòn)" -> "incline barbell bench press"
// Giúp map đúng dù đảo thứ tự từ (barbell incline vs incline barbell).
export function normalizeExerciseName(name?: string): string {
  if (!name) return '';
  return normName(name);
}

function normName(s: string): string {
  let v = s.toLowerCase();
  v = v.replace(/\(.*?\)/g, ' ');
  v = v.replace(/\[.*?\]/g, ' ');
  v = v.replace(/[-_,.:;\/\\+]+/g, ' ');
  v = v.replace(/\s+/g, ' ').trim();
  return v;
}

function tokensOf(s: string): string[] {
  // Giữ cả phần trong ngoặc: tên chính tiếng Việt thì tiếng Anh nằm trong ngoặc và ngược lại.
  // VD: "Ngồi đẩy ngực với máy (Machine Chest Press)" vẫn bắt được machine/chest/press.
  const base = s
    .toLowerCase()
    .replace(/[()\[\]]/g, ' ')
    .replace(/[-_,.:;\/\\+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      if (w === 'pushup' || w === 'pushups' || w === 'push-up' || w === 'push-ups') return 'push';
      if (w === 'pullup' || w === 'pullups' || w === 'pull-up' || w === 'pull-ups') return 'pull';
      if (w === 'chinup' || w === 'chin-up') return 'chin';
      if (w === 'situp' || w === 'sit-up' || w === 'situps') return 'sit';
      if (w === 'dips') return 'dip';
      if (w === 'presses') return 'press';
      if (w === 'db') return 'dumbbell';
      if (w === 'bb') return 'barbell';
      if (w === 'tbar') return 't';
      return w;
    });
}

function hasAll(set: Set<string>, ...words: string[]): boolean {
  return words.every((w) => set.has(w));
}

function hasAny(set: Set<string>, ...words: string[]): boolean {
  return words.some((w) => set.has(w));
}

// Tên chính của các bài trong thư viện: dùng khi tên bạn nhập không có từ khóa tiếng Anh nào.
// Mỗi dòng 1 ảnh Lyfta, bài về sau tự có ảnh theo nhóm cơ này.
const VI_FALLBACK: Array<{ keys: string[]; file: string }> = [
  { keys: ['đẩy ngực trên tạ đòn'], file: '23881101.png' },
  { keys: ['đẩy ngực trên tạ đơn'], file: '03141101.png' },
  { keys: ['ép ngực trong'], file: '13011101.png' },
  { keys: ['ngồi đẩy ngực', 'đẩy ngực với máy'], file: '05771101.png' },
  { keys: ['nhúng người'], file: '17551101.png' },
  { keys: ['biceps', 'tay trước'], file: '00311101.png' },
  { keys: ['tay sau'], file: '02411101.png' },
];

// Tự động suy ảnh Lyfta theo từ khóa, không phụ thuộc thứ tự từ.
// Thứ tự if: cụ thể trước, chung sau. Verified từ og:image trang Lyfta thật.
function autoLyftaFile(tokens: string[]): string | null {
  const set = new Set(tokens);
  const has = (...w: string[]) => hasAll(set, ...w);
  const any = (...w: string[]) => hasAny(set, ...w);

  // Không có token tiếng Anh nào khớp thì trả null để getLyftaDemoImage
  // rơi sang map tiếng Việt / fallback, tránh ảnh sai nhóm cơ.
  const hasEnglish = tokens.some((t) =>
    /^(bench|press|incline|decline|fly|dip|dips|curl|row|raise|raises|squat|deadlift|lunge|crunch|plank|pull|push|chin|shoulder|chest|back|lat|triceps|tricep|bicep|calf|calves|shrug|twist|roller|plank|hyperextension|rdl|ohp|arnold|preacher|hammer|goblet|bulgarian|lunge|thrust|bridge|leg|glute|hamstring|quad|machine|lever|cable|dumbbell|barbell|smith|seated|standing|lying|weighted|close|upright|lateral|front|rear|face|overhead|straight|inverted|alternate|reverse|concentration|sit|up|down|inner|outer)$/.test(t)
  );
  if (!hasEnglish) return null;

  // Ngực
  if (has('barbell', 'incline') && any('bench', 'press')) return '23881101.png';
  if (has('incline') && any('barbell') && any('bench', 'press')) return '23881101.png';
  if (has('smith', 'incline')) return '07571101.png';
  if (has('dumbbell', 'incline') && any('bench', 'press', 'curl') && !has('curl')) return '03141101.png';
  if (has('incline', 'curl')) return '03171101.png';
  if (has('incline') && any('bench', 'press') && !has('curl')) return '03141101.png';
  if (has('decline') && any('bench', 'press')) return '00331101.png';
  if (has('close', 'bench') || (has('close', 'grip') && any('bench', 'press'))) return '00301101.png';
  if (has('smith') && any('bench', 'press')) return '07481101.png';
  if (has('dumbbell', 'bench') || (has('dumbbell') && has('press') && any('bench', 'chest'))) return '02891101.png';
  if (any('inner') && any('chest', 'press')) return '13011101.png';
  if (any('machine', 'lever', 'seated') && has('fly')) return '05961101.png';
  if (any('pec', 'deck') || (has('seated') && has('fly'))) return '05961101.png';
  if (any('lever', 'machine', 'seated') && any('chest', 'press') && !has('fly')) return '05771101.png';
  if (has('cable') && any('fly', 'crossover')) return '02271101.png';
  if (has('standing') && has('fly')) return '02271101.png';
  if (has('dumbbell') && has('fly')) return '03081101.png';
  if (has('weighted') && has('dip')) return '17551101.png';
  if (has('chest', 'dip')) return '02511101.png';
  if (has('bench', 'dip')) return '01291101.png';
  if (has('triceps', 'dip') || (has('tricep') && has('dip'))) return '08141101.png';
  if ((has('push') && any('up', 'ups')) || tokens.includes('pushup')) return '06621101.png';
  if (has('bench', 'press')) return '00251101.png';
  if (has('flat', 'bench')) return '00251101.png';
  if (has('fly') && !has('shoulder')) return '03081101.png';

  // Vai
  if (has('dumbbell', 'seated') && any('shoulder', 'press') && !has('curl')) return '04051101.png';
  if (has('dumbbell') && any('shoulder') && has('press') && !has('curl')) return '04051101.png';
  if (any('lever', 'machine') && any('shoulder', 'press') && any('seated', 'shoulder', 'press')) return '14541101.png';
  if (has('arnold')) return '02871101.png';
  if (has('curl', 'press') || (has('dumbbell') && has('curl') && has('press'))) return '33471301.png';
  if (any('lateral', 'side') && any('raise', 'raises')) return '03341101.png';
  if (has('front') && any('raise', 'raises')) return '03101101.png';
  if (has('upright') && has('row')) return '01201101.png';
  if (any('rear', 'delt') && has('delt') || (has('rear') && has('delt'))) return '03771101.png';
  if (has('face', 'pull')) return '03771101.png';
  if (has('overhead') && has('press') && !has('triceps') && !has('tricep')) return '00911101.png';
  if (has('ohp')) return '00911101.png';
  if (has('shrug')) return '04061101.png';
  if (any('shoulder', 'deltoid', 'delt') && has('press')) return '04051101.png';

  // Lưng / Xô
  if (has('straight', 'arm') && any('pulldown', 'pull')) return '02381101.png';
  if (any('pulldown', 'pull') && has('down') === false && any('lat', 'pulldown')) return '01501101.png';
  if (has('lat') && any('pulldown', 'pull')) return '01501101.png';
  if (any('pulldown')) return '01501101.png';
  if (has('chin') && any('up', 'ups')) return '13261101.png';
  if (has('pull') && any('up', 'ups')) return '06521101.png';
  if (has('one', 'arm') && has('row')) return '02921101.png';
  if (has('barbell') && has('row')) return '00271101.png';
  if (has('bent') && has('row')) return '00271101.png';
  if (has('seated') && has('row')) return '02391101.png';
  if (has('straight', 'back') && has('row')) return '02391101.png';
  if ((has('inverted') || has('australian')) && has('row')) return '04991101.png';
  if ((has('t', 'bar') || has('tbar')) && has('row')) return '06061101.png';
  if (has('t', 'bar')) return '06061101.png';
  if (has('romanian') || has('rdl')) return '00851101.png';
  if (has('deadlift')) return '00321101.png';
  if (has('hyperextension') || (has('back') && has('extension'))) return '04891101.png';
  if (has('row')) return '00271101.png';

  // Chân / Mông
  if (has('front') && has('squat')) return '00421101.png';
  if (any('hack', 'sled') && has('squat')) return '07431101.png';
  if (has('bulgarian') || (has('split') && has('squat'))) return '37431101.png';
  if (has('goblet') && has('squat')) return '17601101.png';
  if (has('barbell') && has('squat')) return '00431101.png';
  if (has('lunge')) return '00541101.png';
  if (has('leg', 'press')) return '07391101.png';
  if (has('leg', 'extension')) return '05851101.png';
  if (has('seated', 'leg', 'curl') || (has('seated') && has('curl') && any('leg', 'hamstring'))) return '05991101.png';
  if (has('lying', 'leg', 'curl') || (has('lying') && has('curl'))) return '05861101.png';
  if (has('leg', 'curl')) return '05991101.png';
  if (has('hip', 'thrust')) return '10601101.png';
  if (has('glute', 'bridge') || (has('bridge') && has('march'))) return '35611101.png';
  if (has('seated', 'calf')) return '00881101.png';
  if (has('calf') || has('calves')) return '04171101.png';
  if (has('squat')) return '00431101.png';

  // Tay trước
  if (has('preacher')) return '00701101.png';
  if (has('concentration')) return '02971101.png';
  if (has('cable') && has('curl')) return '01561101.png';
  if (has('reverse') && has('curl')) return '00801101.png';
  if (has('hammer')) return '03121101.png';
  if (has('alternate') && has('curl')) return '02851101.png';
  if (has('barbell') && has('curl')) return '00311101.png';
  if (has('dumbbell') && has('curl') && !has('press')) return '02851101.png';
  if (has('skull') || (has('lying') && has('triceps'))) return '03511101.png';

  // Tay sau
  if (has('pushdown') || (has('push') && has('down'))) return '02411101.png';
  if (has('overhead') && any('triceps', 'tricep', 'extension')) return '01941101.png';
  if (has('lying') && any('triceps', 'tricep')) return '03511101.png';
  if (has('dip')) return '08141101.png';
  if (any('triceps', 'tricep')) return '02411101.png';
  if (has('curl')) return '00311101.png';

  // Bụng
  if (has('cable') && has('crunch')) return '01751101.png';
  if (has('kneeling') && has('crunch')) return '01751101.png';
  if (has('hanging') && has('leg')) return '04721101.png';
  if (has('leg', 'raise', 'hip') || (has('hip') && has('lift'))) return '18521101.png';
  if (has('leg', 'raise')) return '04721101.png';
  if (has('ab', 'roller') || has('wheel') && has('ab')) return '22691101.png';
  if (has('ab') && has('roller')) return '22691101.png';
  if (has('plank')) return '14401101.png';
  if (has('russian') || (has('russian') && has('twist'))) return '06871101.png';
  if (has('twist')) return '06871101.png';
  if (has('sit') && any('up', 'ups')) return '07351101.png';
  if (has('crunch')) return '02741101.png';

  return null;
}

// Alias cho cách đặt tên khác trong Supabase + biến thể không dấu gạch nối
const LYFTA_ALIASES: Array<{ keys: string[]; file: string }> = [
  // Tên cụ thể đặt trước để không bị khóa chung ăn mất.
  // Verified từ og:image trang Lyfta thật.
  { keys: ['barbell incline bench press', 'incline barbell bench press'], file: '23881101.png' },
  { keys: ['dumbbell incline bench press', 'incline dumbbell press'], file: '03141101.png' },
  { keys: ['machine inner chest press'], file: '13011101.png' },
  { keys: ['lever chest press', 'machine chest press', 'seated chest press'], file: '05771101.png' },
  { keys: ['weighted tricep dips', 'weighted dips'], file: '17551101.png' },
  { keys: ['chest dip'], file: '02511101.png' },
  { keys: ['bench dip'], file: '01291101.png' },
  { keys: ['smith machine incline bench', 'smith incline bench'], file: '07571101.png' },
  { keys: ['smith machine bench press', 'smith bench'], file: '07481101.png' },
  { keys: ['romanian deadlift', 'rdl'], file: '00851101.png' },
  { keys: ['pushup'], file: '06621101.png' },
  { keys: ['skull crusher', 'skullcrusher'], file: '03511101.png' },
  { keys: ['preacher'], file: '00701101.png' },
  { keys: ['upright row'], file: '01201101.png' },
  { keys: ['t-bar', 't bar row'], file: '06061101.png' },
  { keys: ['rear delt', 'face pull'], file: '03771101.png' },
];

const LYFTA_VERIFIED: Array<{ keys: string[]; file: string }> = [
  { keys: ['bulgarian split squat with chair'], file: '37431101.png' },
  { keys: ['dumbbell seated shoulder press'], file: '04051101.png' },
  { keys: ['lever seated shoulder press'], file: '14541101.png' },
  { keys: ['overhead triceps extension'], file: '01941101.png' },
  { keys: ['smith incline bench press'], file: '07571101.png' },
  { keys: ['straight back seated row'], file: '02391101.png' },
  { keys: ['romanian deadlift (rdl)'], file: '00851101.png' },
  { keys: ['lying triceps extension'], file: '03511101.png' },
  { keys: ['incline dumbbell press', 'incline bench press'], file: '03141101.png' },
  { keys: ['dumbbell lateral raise'], file: '03341101.png' },
  { keys: ['triceps cable pushdown'], file: '02411101.png' },
  { keys: ['rear delt row_shoulder'], file: '03771101.png' },
  { keys: ['dumbbell curl to press'], file: '33471301.png' },
  { keys: ['close-grip bench press'], file: '00301101.png' },
  { keys: ['barbell bent-over row'], file: '00271101.png' },
  { keys: ['one arm bent-over row'], file: '02921101.png' },
  { keys: ['straight arm pulldown'], file: '02381101.png' },
  { keys: ['lever seated leg curl'], file: '05991101.png' },
  { keys: ['alternate biceps curl'], file: '02851101.png' },
  { keys: ['dumbbell incline curl'], file: '03171101.png' },
  { keys: ['cable kneeling crunch'], file: '01751101.png' },
  { keys: ['overhead press (ohp)'], file: '00911101.png' },
  { keys: ['dumbbell bench press'], file: '02891101.png' },
  { keys: ['lever lying leg curl'], file: '05861101.png' },
  { keys: ['barbell bench press'], file: '00251101.png' },
  { keys: ['dumbbell bicep curl'], file: '00311101.png' },
  { keys: ['decline bench press'], file: '00331101.png' },
  { keys: ['lever leg extension'], file: '05851101.png' },
  { keys: ['cable standing fly'], file: '02271101.png' },
  { keys: ['glute bridge march'], file: '35611101.png' },
  { keys: ['concentration curl'], file: '02971101.png' },
  { keys: ['leg raise hip lift'], file: '18521101.png' },
  { keys: ['smith bench press'], file: '07481101.png' },
  { keys: ['seated calf raise'], file: '00881101.png' },
  { keys: ['hanging leg raise'], file: '04721101.png' },
  { keys: ['lever seated fly'], file: '05961101.png' },
  { keys: ['ab roller crunch'], file: '22691101.png' },
  { keys: ['plank arm lifts'], file: '14401101.png' },
  { keys: ['lever t bar row'], file: '06061101.png' },
  { keys: ['sled hack squat'], file: '07431101.png' },
  { keys: ['hyperextension'], file: '04891101.png' },
  { keys: ['barbell squat'], file: '00431101.png' },
  { keys: ['preacher curl'], file: '00701101.png' },
  { keys: ['russian twist'], file: '06871101.png' },
  { keys: ['lat pulldown'], file: '01501101.png' },
  { keys: ['dumbbell fly'], file: '03081101.png' },
  { keys: ['arnold press'], file: '02871101.png' },
  { keys: ['inverted row'], file: '04991101.png' },
  { keys: ['goblet squat'], file: '17601101.png' },
  { keys: ['reverse curl'], file: '00801101.png' },
  { keys: ['crunch floor'], file: '02741101.png' },
  { keys: ['calf raises'], file: '04171101.png' },
  { keys: ['front raise'], file: '03101101.png' },
  { keys: ['upright row'], file: '01201101.png' },
  { keys: ['front squat'], file: '00421101.png' },
  { keys: ['hammer curl'], file: '03121101.png' },
  { keys: ['triceps dip'], file: '08141101.png' },
  { keys: ['hip thrust'], file: '10601101.png' },
  { keys: ['cable curl'], file: '01561101.png' },
  { keys: ['leg press'], file: '07391101.png' },
  { keys: ['chest dip'], file: '02511101.png' },
  { keys: ['bench dip'], file: '01291101.png' },
  { keys: ['deadlift'], file: '00321101.png' },
  { keys: ['push-up'], file: '06621101.png' },
  { keys: ['pull-up'], file: '06521101.png' },
  { keys: ['chin-up'], file: '13261101.png' },
  { keys: ['sit-up'], file: '07351101.png' },
  { keys: ['shrug'], file: '04061101.png' },
  { keys: ['lunge'], file: '00541101.png' },
  // Khóa chung cho biến thể tên (đặt cuối để tên cụ thể khớp trước)
  { keys: ['flat bench'], file: '00251101.png' },
  { keys: ['shoulder press', 'shoulder'], file: '04051101.png' },
  { keys: ['hack squat'], file: '07431101.png' },
  { keys: ['leg raise'], file: '04721101.png' },
  { keys: ['ab roller'], file: '22691101.png' },
  { keys: ['plank'], file: '14401101.png' },
  { keys: ['bench press'], file: '00251101.png' },
  { keys: ['pulldown'], file: '01501101.png' },
  { keys: ['squat'], file: '00431101.png' },
  { keys: ['curl'], file: '00311101.png' },
  { keys: ['fly'], file: '03081101.png' },
  { keys: ['crunch'], file: '02741101.png' },
  { keys: ['raise'], file: '03341101.png' },
  { keys: ['dip'], file: '08141101.png' },
  { keys: ['row'], file: '00271101.png' },
];
// Những bài Lyfta KHÔNG có tranh/ảnh minh họa. Trả null để UI hiện
// "Chưa có ảnh minh họa" thay vì gán ảnh sai nhóm cơ.
const NO_IMAGE_KEYS = ['tibialis'];

export function getLyftaDemoImage(nameOrMuscle?: string): string | null {
  if (!nameOrMuscle) return null;
  const raw = nameOrMuscle.toLowerCase();
  if (NO_IMAGE_KEYS.some((k) => raw.includes(k))) return null;
  // 1) Tự nhận diện theo từ khóa (không phụ thuộc thứ tự từ hay ngoặc tiếng Việt).
  // Bài mới sau này tự có ảnh, không cần thêm map tay.
  const auto = autoLyftaFile(tokensOf(nameOrMuscle));
  if (auto) return `${LYFTA_BASE}/${auto}`;
  // 2) Tên chính tiếng Việt trong thư viện (có/không kèm tiếng Anh trong ngoặc).
  for (const entry of VI_FALLBACK) {
    if (entry.keys.some((k) => raw.includes(k))) return `${LYFTA_BASE}/${entry.file}`;
  }
  const name = ` ${normName(nameOrMuscle)} `;
  for (const entry of [...LYFTA_ALIASES, ...LYFTA_VERIFIED]) {
    if (entry.keys.some((k) => name.includes(` ${normName(k)} `) || raw.includes(k))) return `${LYFTA_BASE}/${entry.file}`;
  }
  // Fallback theo nhóm cơ để vẫn có ảnh giống Lyfta thay vì ô trống
  if (name.includes(' ngực ') || raw.includes('ngực') || name.includes(' chest ')) return `${LYFTA_BASE}/00251101.png`;
  if (raw.includes('vai') || name.includes(' shoulder ') || name.includes(' deltoid ')) return `${LYFTA_BASE}/03341101.png`;
  if (raw.includes('xô') || raw.includes('lưng') || name.includes(' back ') || name.includes(' lat ')) return `${LYFTA_BASE}/01501101.png`;
  if (raw.includes('tay trước') || name.includes(' bicep ')) return `${LYFTA_BASE}/00311101.png`;
  if (raw.includes('tay sau') || name.includes(' tricep ')) return `${LYFTA_BASE}/02411101.png`;
  if (raw.includes('chân') || raw.includes('đùi') || name.includes(' quad ') || name.includes(' squat ') || name.includes(' leg ')) return `${LYFTA_BASE}/00431101.png`;
  if (raw.includes('bắp chân') || name.includes(' calf ')) return `${LYFTA_BASE}/04171101.png`;
  if (raw.includes('bụng') || name.includes(' abs ') || name.includes(' core ')) return `${LYFTA_BASE}/06621101.png`;
  // Không để ô No image: bài lạ thì trả ảnh deadlift trung tính của Lyfta.
  return `${LYFTA_BASE}/00321101.png`;
}

export function resolveExerciseImage(ex?: { image_url?: string; muscle_diagram_url?: string; name?: string; primary_muscle?: string }): string | null {
  if (!ex) return null;
  // 1) Ưu tiên ảnh Lyfta đã verified gắn sẵn trong thư viện.
  if (ex.image_url && ex.image_url.includes('lyfta.app')) return ex.image_url;
  if (ex.muscle_diagram_url && ex.muscle_diagram_url.includes('lyfta.app')) return ex.muscle_diagram_url;
  // 2) Bài Lyfta không có tranh minh hoạ -> giữ ô trống, đừng gán ảnh sai nhóm cơ.
  const nameRaw = (ex.name || '').toLowerCase();
  if (NO_IMAGE_KEYS.some((k) => nameRaw.includes(k))) return null;
  // 3) Dữ liệu cũ chỉ có ảnh giải phẫu -> suy ảnh Lyfta theo tên bài / nhóm cơ.
  const byName = getLyftaDemoImage(ex.name);
  if (byName) return byName;
  if (ex.image_url) return ex.image_url;
  if (ex.muscle_diagram_url) return ex.muscle_diagram_url;
  return getLyftaDemoImage(ex.primary_muscle);
}

// Nhóm cơ chuẩn cho mô hình giải phẫu: DB của bạn có thể lưu tiếng Việt ("Cơ ngực")
// thì suy luận lại từ tên bài, còn key tiếng Anh thì giữ nguyên.
const ENGLISH_MUSCLE_RE = /chest|shoulder|delts|back|lats|bicep|tricep|quad|hamstring|glute|calf|calves|abs|traps|forearm|oblique|trapezius|teres|dorsi|mid_|lower_|upper_|side_|rear_|front_/i;

export function resolveAnatomyMuscle(ex?: { primary_muscle?: string; name?: string }): string {
  const pm = (ex?.primary_muscle || '').trim();
  if (pm && ENGLISH_MUSCLE_RE.test(pm)) return pm;
  return inferPrimaryMuscle(ex?.name);
}

export function inferPrimaryMuscle(name?: string, fallback?: string): string {
  if (fallback) return fallback;
  if (!name) return '';
  const n = name.toLowerCase();
  // Dip: phân biệt ngực / tay sau trước khi check 'bench' (vì 'bench dip' chứa 'bench')
  if (n.includes('dip')) {
    if (n.includes('chest')) return 'chest';
    return 'triceps';
  }
  // Vai sau / cầu vai trên: check trước 'row' (vì 'upright row' và 'rear delt row' chứa 'row')
  if (n.includes('rear delt') || n.includes('upright row') || n.includes('face pull')) return 'shoulders';
  if (n.includes('bench') || n.includes('fly') || n.includes('push-up') || n.includes('pushup') || n.includes('ngực') || n.includes('chest')) return 'chest';
  if (n.includes('pulldown') || n.includes('pull-up') || n.includes('pullup') || n.includes('chin') || n.includes('xô') || n.includes('lats')) return 'lats';
  if (n.includes('row') || n.includes('lưng') || n.includes('back')) return 'lats';
  if (n.includes('shrug') || n.includes('cầu vai')) return 'traps';
  if (n.includes('hyperextension')) return 'lower_back';
  if (n.includes('overhead') || n.includes('ohp') || n.includes('arnold') || n.includes('lateral raise') || n.includes('vai') || n.includes('shoulder') || n.includes('deltoid')) return 'shoulders';
  if (n.includes('squat') || n.includes('leg press') || n.includes('leg extension') || n.includes('quads') || n.includes('đùi trước')) return 'quads';
  if (n.includes('rdl') || n.includes('romanian') || n.includes('deadlift') || n.includes('hamstring') || n.includes('đùi sau') || n.includes('glute') || n.includes('mông')) return 'hamstrings';
  if (n.includes('bicep') || n.includes('curl') || n.includes('tay trước')) return 'biceps';
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('tay sau') || n.includes('skull')) return 'triceps';
  if (n.includes('calf') || n.includes('bắp chân')) return 'calves';
  if (n.includes('abs') || n.includes('crunch') || n.includes('plank') || n.includes('sit-up') || n.includes('situp') || n.includes('twist') || n.includes('leg raise') || n.includes('bụng') || n.includes('core')) return 'abs';
  return '';
}
