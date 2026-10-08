// lib/lyfta.ts - Ánh xạ ảnh minh họa kiểu Lyfta + suy luận nhóm cơ từ tên bài
// Giữ nguyên UI/logic cũ, chỉ thêm nguồn ảnh để danh sách tìm kiếm hiển thị giống Lyfta.

const LYFTA_BASE = 'https://lyfta.app/images/exercises';

// Các ID đã kiểm chứng tồn tại trên lyfta.app
const KNOWN_IMAGES: Array<{ keys: string[]; file: string }> = [
  { keys: ['smith machine bench', 'smith bench'], file: '07481101.png' },
  { keys: ['preacher curl'], file: '00701101.png' },
  { keys: ['incline bench', 'incline dumbbell press'], file: '03141101.png' },
  { keys: ['dumbbell bench press'], file: '02891101.png' },
  { keys: ['bench press'], file: '00251101.png' },
  { keys: ['triceps pushdown', 'cable pushdown', 'pushdown'], file: '02411101.png' },
  { keys: ['lateral raise'], file: '03341101.png' },
  { keys: ['full squat', 'barbell squat', 'squat'], file: '00431101.png' },
  { keys: ['seated row', 'straight back seated row'], file: '02391101.png' },
  { keys: ['bent-over row', 'bent over row', 'barbell row'], file: '00271101.png' },
  { keys: ['one arm bent', 'one-arm bent'], file: '02921101.png' },
  { keys: ['bar lateral pulldown', 'lat pulldown', 'pulldown'], file: '01501101.png' },
  { keys: ['hammer curl'], file: '03121101.png' },
  { keys: ['alternate biceps', 'alternate curl'], file: '02851101.png' },
  { keys: ['incline curl', 'dumbbell incline curl'], file: '03171101.png' },
  { keys: ['barbell curl', 'bicep curl', 'biceps curl'], file: '00311101.png' },
  { keys: ['seated leg curl'], file: '05991101.png' },
  { keys: ['leg extension'], file: '05851101.png' },
  { keys: ['standing calf', 'calf raise', 'calf raises'], file: '04171101.png' },
  { keys: ['seated fly', 'lever seated fly'], file: '05961101.png' },
  { keys: ['cable fly', 'standing fly'], file: '02271101.png' },
  { keys: ['push-up', 'pushup'], file: '06621101.png' },
];

export function getLyftaDemoImage(nameOrMuscle?: string): string | null {
  if (!nameOrMuscle) return null;
  const name = nameOrMuscle.toLowerCase();
  for (const entry of KNOWN_IMAGES) {
    if (entry.keys.some((k) => name.includes(k))) return `${LYFTA_BASE}/${entry.file}`;
  }
  // Fallback theo nhóm cơ để vẫn có ảnh giống Lyfta thay vì ô trống
  if (name.includes('ngực') || name.includes('chest')) return `${LYFTA_BASE}/00251101.png`;
  if (name.includes('vai') || name.includes('shoulder') || name.includes('deltoid')) return `${LYFTA_BASE}/03341101.png`;
  if (name.includes('xô') || name.includes('lưng') || name.includes('back') || name.includes('lat')) return `${LYFTA_BASE}/01501101.png`;
  if (name.includes('tay trước') || name.includes('bicep')) return `${LYFTA_BASE}/00311101.png`;
  if (name.includes('tay sau') || name.includes('tricep')) return `${LYFTA_BASE}/02411101.png`;
  if (name.includes('chân') || name.includes('đùi') || name.includes('quad') || name.includes('squat') || name.includes('leg')) return `${LYFTA_BASE}/00431101.png`;
  if (name.includes('bắp chân') || name.includes('calf')) return `${LYFTA_BASE}/04171101.png`;
  if (name.includes('bụng') || name.includes('abs') || name.includes('core')) return `${LYFTA_BASE}/06621101.png`;
  return null;
}

export function resolveExerciseImage(ex?: { image_url?: string; muscle_diagram_url?: string; name?: string; primary_muscle?: string }): string | null {
  if (!ex) return null;
  if (ex.image_url) return ex.image_url;
  if (ex.muscle_diagram_url) return ex.muscle_diagram_url;
  return getLyftaDemoImage(ex.name) || getLyftaDemoImage(ex.primary_muscle);
}

export function inferPrimaryMuscle(name?: string, fallback?: string): string {
  if (fallback) return fallback;
  if (!name) return '';
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('fly') || n.includes('push-up') || n.includes('pushup') || n.includes('ngực') || n.includes('chest')) return 'chest';
  if (n.includes('pulldown') || n.includes('pull-up') || n.includes('xô') || n.includes('lats')) return 'lats';
  if (n.includes('row') || n.includes('deadlift') || n.includes('lưng') || n.includes('back')) return 'lats';
  if (n.includes('overhead') || n.includes('ohp') || n.includes('lateral raise') || n.includes('vai') || n.includes('shoulder') || n.includes('deltoid')) return 'shoulders';
  if (n.includes('squat') || n.includes('leg press') || n.includes('leg extension') || n.includes('quads') || n.includes('đùi trước')) return 'quads';
  if (n.includes('rdl') || n.includes('romanian') || n.includes('hamstring') || n.includes('đùi sau') || n.includes('glute') || n.includes('mông')) return 'hamstrings';
  if (n.includes('bicep') || n.includes('curl') || n.includes('tay trước')) return 'biceps';
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('tay sau') || n.includes('skull')) return 'triceps';
  if (n.includes('calf') || n.includes('bắp chân')) return 'calves';
  if (n.includes('abs') || n.includes('crunch') || n.includes('plank') || n.includes('bụng') || n.includes('core')) return 'abs';
  return '';
}
