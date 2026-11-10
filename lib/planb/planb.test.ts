import { describe, expect, it } from 'vitest';
import { EXERCISES_FULL } from '@/lib/exercises-full';
import { PLANB_LIBRARY, PLANB_PROFILES, classifyLibrary, findPlanBExercise } from './classification';
import { rankAlternatives } from './recommendation';
import { differencesFor, reasonFor } from './explain';
import type { PlanBExercise } from './types';

const byId = (id: string): PlanBExercise => {
  const found = findPlanBExercise(id);
  if (!found) throw new Error(`Missing Plan B exercise: ${id}`);
  return found;
};

const names = (base: PlanBExercise, exclude: string[] = []) =>
  rankAlternatives(base, PLANB_LIBRARY, exclude).map((r) => r.exercise.id);

describe('classification', () => {
  it('classifies every exercise in the library', () => {
    const missing = EXERCISES_FULL.filter((ex) => !PLANB_PROFILES[ex.id]).map((ex) => ex.id);
    expect(missing).toEqual([]);
    expect(PLANB_LIBRARY).toHaveLength(EXERCISES_FULL.length);
  });

  it('classifies cloud rows by name when the id is a UUID', () => {
    const cloud = EXERCISES_FULL.map((ex, i) => ({ ...ex, id: `uuid-${i}` }));
    const library = classifyLibrary(cloud);
    expect(library).toHaveLength(cloud.length);

    const base = library.find((ex) => ex.name === byId('ex_15').name)!;
    expect(base.id).toMatch(/^uuid-/);
    const ranked = rankAlternatives(base, library);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((r) => r.exercise.id.startsWith('uuid-'))).toBe(true);
  });

  it('has no profile for an id that is not in the library', () => {
    const libraryIds = new Set(EXERCISES_FULL.map((ex) => ex.id));
    const stray = Object.keys(PLANB_PROFILES).filter((id) => !libraryIds.has(id));
    expect(stray).toEqual([]);
  });
});

describe('rankAlternatives — stage 1 filter', () => {
  it('only returns exercises with the same muscle group and target region', () => {
    for (const base of PLANB_LIBRARY) {
      for (const result of rankAlternatives(base, PLANB_LIBRARY)) {
        expect(result.exercise.muscleGroup).toBe(base.muscleGroup);
        expect(result.exercise.targetRegion).toBe(base.targetRegion);
        expect(result.exercise.id).not.toBe(base.id);
        expect(result.exercise.classifyStatus).toBe('classified');
      }
    }
  });

  it('keeps incline press away from middle chest', () => {
    const ids = names(byId('ex_94'));
    expect(ids).toContain('ex_2');
    expect(ids).not.toContain('ex_1');
    expect(ids).not.toContain('ex_15');
  });

  it('excludes needs-review entries and exercises already in the workout', () => {
    const ids = names(byId('ex_6'), ['ex_29']);
    expect(ids).not.toContain('ex_34');
    expect(ids).not.toContain('ex_117');
    expect(ids).not.toContain('ex_29');
    expect(ids).toContain('ex_30');
  });

  it('returns an empty list when the region has no other candidates', () => {
    expect(rankAlternatives(byId('ex_134'), PLANB_LIBRARY)).toEqual([]);
  });
});

describe('rankAlternatives — stage 2 ranking', () => {
  it('puts same-pattern swaps first and recommends only the top one', () => {
    const ranked = rankAlternatives(byId('ex_6'), PLANB_LIBRARY);
    expect(ranked[0].exercise.movementPattern).toBe('Vertical Pull');
    expect(ranked[0].recommended).toBe(true);
    expect(ranked.filter((r) => r.recommended)).toHaveLength(1);
  });

  it('never recommends a different movement style', () => {
    for (const base of PLANB_LIBRARY) {
      for (const result of rankAlternatives(base, PLANB_LIBRARY)) {
        if (result.isDifferentStyle) expect(result.recommended).toBe(false);
      }
    }
  });

  it('does not recommend when no candidate shares the exact pattern', () => {
    // Front raise chỉ có các bài đẩy vai cùng vùng -> khác kiểu động tác.
    const ranked = rankAlternatives(byId('ex_24'), PLANB_LIBRARY);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((r) => !r.recommended)).toBe(true);
  });
});

describe('explain', () => {
  it('describes a same-pattern swap in Vietnamese', () => {
    const reason = reasonFor(byId('ex_1'), byId('ex_15'));
    expect(reason).toContain('Cùng vùng cơ: Ngực giữa');
    expect(reason).toContain('Cùng kiểu động tác');
  });

  it('lists the equipment difference', () => {
    expect(differencesFor(byId('ex_1'), byId('ex_15'))).toContain(
      'Dụng cụ: Dumbbell thay vì Barbell',
    );
  });
});
