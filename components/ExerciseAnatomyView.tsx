// components/ExerciseAnatomyView.tsx
'use client';

import React from 'react';

export interface ExerciseAnatomyProps {
  primaryMuscle?: string;
  secondaryMuscles?: string | string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  view?: 'both' | 'front' | 'back';
}

const MUSCLE_TRANSLATIONS: Record<string, string> = {
  chest: 'Ngực (Pectoralis)',
  upper_chest: 'Ngực trên (Upper Chest)',
  lower_chest: 'Ngực dưới (Lower Chest)',
  lats: 'Lưng xô (Latissimus)',
  mid_back: 'Lưng giữa (Rhomboids)',
  lower_back: 'Lưng dưới (Lower Back)',
  traps: 'Cầu vai (Trapezius)',
  shoulders: 'Vai toàn diện (Deltoids)',
  front_delts: 'Vai trước (Anterior Deltoid)',
  side_delts: 'Vai giữa (Lateral Deltoid)',
  rear_delts: 'Vai sau (Posterior Deltoid)',
  biceps: 'Tay trước (Biceps)',
  triceps: 'Tay sau (Triceps)',
  forearms: 'Cẳng tay (Forearms)',
  quads: 'Đùi trước (Quadriceps)',
  hamstrings: 'Đùi sau (Hamstrings)',
  glutes: 'Cơ mông (Glutes)',
  calves: 'Bắp chân (Calves)',
  abs: 'Cơ bụng (Abs/Core)',
  obliques: 'Cơ liên sườn (Obliques)',
  adductors: 'Đùi trong (Adductors)',
};

export function getMuscleLabel(key?: string): string {
  if (!key) return 'Toàn thân';
  return MUSCLE_TRANSLATIONS[key] || key;
}

export default function ExerciseAnatomyView({
  primaryMuscle = '',
  secondaryMuscles = '',
  size = 'md',
  showLabels = false,
  view = 'both',
}: ExerciseAnatomyProps) {
  const primary = (primaryMuscle || '').toLowerCase().trim();
  const secondaryList = (
    Array.isArray(secondaryMuscles)
      ? secondaryMuscles
      : (secondaryMuscles || '').split(',')
  ).map((s) => s.toLowerCase().trim()).filter(Boolean);

  const matchMuscle = (muscleKey: string, target: string): boolean => {
    if (!muscleKey || !target) return false;
    const a = muscleKey.toLowerCase().trim();
    const b = target.toLowerCase().trim();
    return a.includes(b) || b.includes(a);
  };

  const isPrimary = (muscleKey: string): boolean => {
    if (!muscleKey || !primary) return false;
    if (matchMuscle(muscleKey, primary)) return true;
    // Map nhóm cơ chung: shoulders bao gồm front/side/rear delts, chest bao gồm upper/lower
    if (primary.includes('shoulder') && ['front_delts', 'side_delts', 'rear_delts', 'shoulders'].includes(muscleKey)) return true;
    if (primary.includes('chest') && ['chest', 'upper_chest', 'lower_chest'].includes(muscleKey)) return true;
    if (primary.includes('back') && ['lats', 'mid_back', 'lower_back', 'traps'].includes(muscleKey)) return true;
    if (primary.includes('quad') && ['quads'].includes(muscleKey)) return true;
    return false;
  };

  const isSecondary = (muscleKey: string): boolean => {
    if (!muscleKey) return false;
    return secondaryList.some((s) => matchMuscle(muscleKey, s));
  };

  const BASE = '#c2c9d6';
  const BASE_STROKE = '#8a94a8';
  const PRIMARY = '#ef4444';
  const PRIMARY_STROKE = '#b91c1c';
  const SECONDARY = '#f59e0b';
  const SECONDARY_STROKE = '#b45309';

  const getHighlightColor = (muscleKey: string): string => {
    if (!muscleKey) return BASE;
    if (isPrimary(muscleKey)) return PRIMARY;
    if (isSecondary(muscleKey)) return SECONDARY;
    return BASE;
  };

  const getFill = (muscleKey: string): string => {
    return getHighlightColor(muscleKey);
  };

  const getStroke = (muscleKey: string): string => {
    const fill = getHighlightColor(muscleKey);
    if (fill === '#ef4444') return PRIMARY_STROKE;
    if (fill === '#f59e0b') return SECONDARY_STROKE;
    return BASE_STROKE;
  };

  const getGlow = (muscleKey: string): string | undefined => {
    const fill = getHighlightColor(muscleKey);
    if (fill === '#ef4444') return 'drop-shadow(0 0 5px rgba(239,68,68,0.65))';
    if (fill === '#f59e0b') return 'drop-shadow(0 0 5px rgba(245,158,11,0.55))';
    return undefined;
  };

  const sizeClasses = {
    xs: 'w-12 h-16',
    sm: 'w-20 h-28',
    md: 'w-40 h-52',
    lg: 'w-72 h-[300px]',
  }[size];

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className={`flex items-start justify-center gap-3 ${sizeClasses}`}>
        {(view === 'both' || view === 'front') && (
          <div className="relative w-1/2 h-full flex flex-col items-center">
            {showLabels && (
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-1.5 px-2.5 py-0.5 rounded-full bg-white border border-zinc-200 shadow-sm">
                Trước
              </span>
            )}
            <div className="w-full flex-1 rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-1.5 flex items-center justify-center">
              <svg
                viewBox="0 0 100 175"
                className="w-full h-full transition-all"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Đầu & Cổ */}
                <circle cx="50" cy="12" r="8.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                <rect x="44.5" y="19.5" width="11" height="7" rx="2.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />

                {/* Cầu vai */}
                <path
                  d="M36 26.5 L64 26.5 L71 34 L29 34 Z"
                  fill={getFill('traps')}
                  stroke={getStroke('traps')}
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('traps') }}
                />

                {/* Vai */}
                <ellipse cx="25.5" cy="38" rx="8" ry="10" fill={getFill('shoulders') !== BASE ? getFill('shoulders') : getFill('front_delts')} stroke={getStroke('shoulders')} strokeWidth="1.4" style={{ filter: getGlow('shoulders') }} />
                <ellipse cx="74.5" cy="38" rx="8" ry="10" fill={getFill('shoulders') !== BASE ? getFill('shoulders') : getFill('front_delts')} stroke={getStroke('shoulders')} strokeWidth="1.4" style={{ filter: getGlow('shoulders') }} />

                {/* Ngực - 2 mảng lớn rõ khối */}
                <path
                  d="M31.5 35 L48.5 35 L48.5 51 C44 53.5 36 52.5 32.5 47 C31 43 31 38 31.5 35 Z"
                  fill={getFill('chest') !== BASE ? getFill('chest') : getFill('upper_chest')}
                  stroke={getStroke('chest')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('chest') }}
                />
                <path
                  d="M51.5 35 L68.5 35 C69 38 69 43 67.5 47 C64 52.5 56 53.5 51.5 51 Z"
                  fill={getFill('chest') !== BASE ? getFill('chest') : getFill('upper_chest')}
                  stroke={getStroke('chest')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('chest') }}
                />
                {/* Rãnh ngực giữa */}
                <line x1="50" y1="35" x2="50" y2="51" stroke="#ffffff" strokeWidth="1" opacity="0.7" strokeLinecap="round" />

                {/* Tay trước */}
                <rect x="15.5" y="47" width="10" height="20" rx="5" fill={getFill('biceps')} stroke={getStroke('biceps')} strokeWidth="1.4" style={{ filter: getGlow('biceps') }} />
                <rect x="74.5" y="47" width="10" height="20" rx="5" fill={getFill('biceps')} stroke={getStroke('biceps')} strokeWidth="1.4" style={{ filter: getGlow('biceps') }} />

                {/* Cẳng tay */}
                <rect x="15" y="69" width="9" height="22" rx="4.5" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.4" style={{ filter: getGlow('forearms') }} />
                <rect x="76" y="69" width="9" height="22" rx="4.5" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.4" style={{ filter: getGlow('forearms') }} />
                <circle cx="19.5" cy="94" r="4" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                <circle cx="80.5" cy="94" r="4" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />

                {/* Eo + Bụng 6 múi to rõ */}
                <rect x="33" y="53" width="34" height="30" rx="6" fill="#eef1f6" stroke={BASE_STROKE} strokeWidth="1.1" />
                <g fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1.2" style={{ filter: getGlow('abs') }}>
                  <rect x="38" y="55.5" width="11" height="7.5" rx="2" />
                  <rect x="51" y="55.5" width="11" height="7.5" rx="2" />
                  <rect x="38" y="64.5" width="11" height="7.5" rx="2" />
                  <rect x="51" y="64.5" width="11" height="7.5" rx="2" />
                  <rect x="38.5" y="73.5" width="10.5" height="7" rx="2" />
                  <rect x="51" y="73.5" width="10.5" height="7" rx="2" />
                </g>
                {/* Liên sườn */}
                <path d="M32 55 C30.5 62 31 74 36 81.5 L38.5 81.5 L38.5 55 Z" fill={getFill('obliques')} stroke={getStroke('obliques')} strokeWidth="1.2" style={{ filter: getGlow('obliques') }} />
                <path d="M68 55 C69.5 62 69 74 64 81.5 L61.5 81.5 L61.5 55 Z" fill={getFill('obliques')} stroke={getStroke('obliques')} strokeWidth="1.2" style={{ filter: getGlow('obliques') }} />

                {/* Hông */}
                <rect x="34" y="83" width="32" height="10" rx="4" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />

                {/* Đùi trước to khối */}
                <path
                  d="M32 95 C30 107 31.5 124 35.5 134 C38 135 43 134.5 44.5 132 C46 121 46 106 44 95 Z"
                  fill={getFill('quads')}
                  stroke={getStroke('quads')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('quads') }}
                />
                <path
                  d="M68 95 C70 107 68.5 124 64.5 134 C62 135 57 134.5 55.5 132 C54 121 54 106 56 95 Z"
                  fill={getFill('quads')}
                  stroke={getStroke('quads')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('quads') }}
                />
                {/* Rãnh đùi giữa */}
                <line x1="50" y1="95" x2="50" y2="130" stroke={BASE_STROKE} strokeWidth="1" opacity="0.5" />

                {/* Gối */}
                <circle cx="40" cy="138" r="4.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                <circle cx="60" cy="138" r="4.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />

                {/* Bắp chân */}
                <path
                  d="M34.5 143 C33 150 33.5 160 36 166 C38.5 166.5 41.5 165.5 42.5 163 C43 155 42.5 148 41 143 Z"
                  fill={getFill('calves')}
                  stroke={getStroke('calves')}
                  strokeWidth="1.4"
                  style={{ filter: getGlow('calves') }}
                />
                <path
                  d="M65.5 143 C67 150 66.5 160 64 166 C61.5 166.5 58.5 165.5 57.5 163 C57 155 57.5 148 59 143 Z"
                  fill={getFill('calves')}
                  stroke={getStroke('calves')}
                  strokeWidth="1.4"
                  style={{ filter: getGlow('calves') }}
                />
              </svg>
            </div>
          </div>
        )}

        {(view === 'both' || view === 'back') && (
          <div className="relative w-1/2 h-full flex flex-col items-center">
            {showLabels && (
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-1.5 px-2.5 py-0.5 rounded-full bg-white border border-zinc-200 shadow-sm">
                Sau
              </span>
            )}
            <div className="w-full flex-1 rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-1.5 flex items-center justify-center">
              <svg
                viewBox="0 0 100 175"
                className="w-full h-full transition-all"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="12" r="8.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                {/* Cầu vai hình thang lớn */}
                <path
                  d="M50 20 L68 33 L60 55 L50 60 L40 55 L32 33 Z"
                  fill={getFill('traps')}
                  stroke={getStroke('traps')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('traps') }}
                />
                {/* Sống lưng giữa */}
                <line x1="50" y1="24" x2="50" y2="58" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" strokeLinecap="round" />

                {/* Vai sau */}
                <ellipse cx="25.5" cy="38" rx="8" ry="10" fill={getFill('rear_delts') !== BASE ? getFill('rear_delts') : getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="1.4" style={{ filter: getGlow('shoulders') }} />
                <ellipse cx="74.5" cy="38" rx="8" ry="10" fill={getFill('rear_delts') !== BASE ? getFill('rear_delts') : getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="1.4" style={{ filter: getGlow('shoulders') }} />

                {/* Lưng xô bản lớn chữ V */}
                <path
                  d="M32 36 L44 38 L46 62 L40 74 L33 68 C30 58 30 46 32 36 Z"
                  fill={getFill('lats')}
                  stroke={getStroke('lats')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('lats') }}
                />
                <path
                  d="M68 36 L56 38 L54 62 L60 74 L67 68 C70 58 70 46 68 36 Z"
                  fill={getFill('lats')}
                  stroke={getStroke('lats')}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  style={{ filter: getGlow('lats') }}
                />
                {/* Lưng giữa / dưới */}
                <rect x="43" y="56" width="14" height="24" rx="3" fill={getFill('mid_back') !== BASE ? getFill('mid_back') : getFill('lower_back') !== BASE ? getFill('lower_back') : getFill('lats') !== BASE ? getFill('lats') : BASE} stroke={getStroke('lower_back')} strokeWidth="1.4" style={{ filter: getGlow('lower_back') }} />

                {/* Tay sau */}
                <rect x="15.5" y="47" width="10" height="20" rx="5" fill={getFill('triceps')} stroke={getStroke('triceps')} strokeWidth="1.4" style={{ filter: getGlow('triceps') }} />
                <rect x="74.5" y="47" width="10" height="20" rx="5" fill={getFill('triceps')} stroke={getStroke('triceps')} strokeWidth="1.4" style={{ filter: getGlow('triceps') }} />
                <rect x="15" y="69" width="9" height="22" rx="4.5" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.4" />
                <rect x="76" y="69" width="9" height="22" rx="4.5" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.4" />
                <circle cx="19.5" cy="94" r="4" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                <circle cx="80.5" cy="94" r="4" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />

                {/* Mông tròn rõ */}
                <ellipse cx="42" cy="88" rx="9.5" ry="8.5" fill={getFill('glutes')} stroke={getStroke('glutes')} strokeWidth="1.5" style={{ filter: getGlow('glutes') }} />
                <ellipse cx="58" cy="88" rx="9.5" ry="8.5" fill={getFill('glutes')} stroke={getStroke('glutes')} strokeWidth="1.5" style={{ filter: getGlow('glutes') }} />

                {/* Đùi sau */}
                <path d="M32.5 99 C31 110 32 124 35.5 133 C38 134 43 133.5 44 131 C45.5 121 45 108 43.5 99 Z" fill={getFill('hamstrings')} stroke={getStroke('hamstrings')} strokeWidth="1.5" strokeLinejoin="round" style={{ filter: getGlow('hamstrings') }} />
                <path d="M67.5 99 C69 110 68 124 64.5 133 C62 134 57 133.5 56 131 C54.5 121 55 108 56.5 99 Z" fill={getFill('hamstrings')} stroke={getStroke('hamstrings')} strokeWidth="1.5" strokeLinejoin="round" style={{ filter: getGlow('hamstrings') }} />
                <circle cx="40" cy="138" r="4.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                <circle cx="60" cy="138" r="4.5" fill={BASE} stroke={BASE_STROKE} strokeWidth="1.2" />
                <path d="M34.5 143 C33 150 33.5 160 36 166 C38.5 166.5 41.5 165.5 42.5 163 C43 155 42.5 148 41 143 Z" fill={getFill('calves')} stroke={getStroke('calves')} strokeWidth="1.4" style={{ filter: getGlow('calves') }} />
                <path d="M65.5 143 C67 150 66.5 160 64 166 C61.5 166.5 58.5 165.5 57.5 163 C57 155 57.5 148 59 143 Z" fill={getFill('calves')} stroke={getStroke('calves')} strokeWidth="1.4" style={{ filter: getGlow('calves') }} />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Chú thích màu chuẩn Lyfta */}
      {showLabels && (
        <div className="flex items-center gap-2 mt-3 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" /> Cơ chính
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> Cơ phụ
          </span>
        </div>
      )}
    </div>
  );
}
