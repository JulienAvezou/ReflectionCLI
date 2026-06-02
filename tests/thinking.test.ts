import {
  analyzeHeatmap,
  calculateOutsourcingRisk,
  calculateThinkingScore,
  generatePractice,
  improvePrompt,
  recommendThinkingMode,
  scoreArchetype,
} from '../src/thinking';
import { ReflectionLog } from '../src/types';

function baseLog(): ReflectionLog {
  return {
    version: '1.0',
    entries: [],
    comprehensionDebt: [],
    learningEntries: [],
    explainBackEntries: [],
    thinkingModeSessions: [],
    thinkingScores: [],
    outsourcingAudits: [],
    decisionEntries: [],
    heatmapSnapshots: [],
    archetypeResults: [],
    promptReflections: [],
    stats: { totalCommits: 0, projectStartDate: '2026-01-01' },
  };
}

describe('Thinking mode recommendation', () => {
  test('should recommend decide for option comparison', () => {
    const result = recommendThinkingMode('choose between Redis caching and local memory cache');

    expect(result.mode).toBe('Decide');
    expect(result.prompts.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Thinking score calculation', () => {
  test('should calculate total and dimension extremes', () => {
    const result = calculateThinkingScore({
      understanding: [5, 4],
      verification: [2, 2],
      reflection: [4, 4],
      decisionQuality: [3, 3],
      aiDependency: [5, 5],
    });

    expect(result.total).toBe(37);
    expect(result.strongest).toBe('aiDependency');
    expect(result.weakest).toBe('verification');
  });

  test('should reject invalid score input', () => {
    expect(() =>
      calculateThinkingScore({
        understanding: [6],
        verification: [2],
        reflection: [4],
        decisionQuality: [3],
        aiDependency: [5],
      })
    ).toThrow('Thinking score answers must be integers from 1 to 5');
  });
});

describe('AI outsourcing audit risk', () => {
  test('should calculate high risk when AI was not verified or explained', () => {
    const result = calculateOutsourcingRisk({
      aiGenerated: true,
      verifiedOutput: false,
      canExplain: false,
      testedEdgeCases: false,
      comparedAlternatives: false,
      challengedSuggestion: false,
    });

    expect(result.risk).toBe('High');
    expect(result.riskAreas).toContain('Cannot explain why it works');
  });
});

describe('Heatmap analysis', () => {
  test('should identify weakest areas and suggested focus', () => {
    const result = analyzeHeatmap(
      [
        { area: 'Frontend', score: 4 },
        { area: 'Backend', score: 2 },
        { area: 'Security', score: 1 },
      ],
      5
    );

    expect(result.weakestAreas[0].area).toBe('Security');
    expect(result.suggestedFocus).toContain('Security');
  });

  test('should reject out of range heatmap scores', () => {
    expect(() => analyzeHeatmap([{ area: 'Backend', score: 11 }], 10)).toThrow(
      'Heatmap scores must be integers from 1 to 10'
    );
  });
});

describe('Archetype scoring', () => {
  test('should score a primary and secondary archetype', () => {
    const result = scoreArchetype([
      'AI Challenger',
      'AI Challenger',
      'AI Architect',
      'AI Assistant',
    ]);

    expect(result.primary).toBe('AI Challenger');
    expect(result.secondary).toBeDefined();
  });

  test('should reject invalid archetype answers', () => {
    expect(() => scoreArchetype(['Not Real' as never])).toThrow(
      'Archetype answers must be one of'
    );
  });
});

describe('Prompt reflection', () => {
  test('should generate an improved prompt version', () => {
    const prompt = improvePrompt({
      promptUsed: 'Write a cache',
      goal: 'Add predictable caching',
      hiddenAssumptions: 'Assume Redis is available',
      unclear: 'Expiration policy',
    });

    expect(prompt).toContain('Goal:');
    expect(prompt).toContain('Expiration policy');
  });
});

describe('Practice generation', () => {
  test('should handle empty local history', () => {
    const practice = generatePractice(baseLog());

    expect(practice.title).toBe('Explain One Recent AI-Assisted Change');
    expect(practice.steps.length).toBeGreaterThanOrEqual(3);
  });

  test('should prefer high outsourcing audit risk', () => {
    const log = baseLog();
    log.outsourcingAudits.push({
      id: 'audit-001',
      timestamp: '2026-06-02T00:00:00.000Z',
      date: '2026-06-02',
      answers: {
        aiGenerated: true,
        verifiedOutput: false,
        canExplain: false,
        testedEdgeCases: false,
        comparedAlternatives: false,
        challengedSuggestion: false,
      },
      risk: 'High',
      riskAreas: ['Cannot explain why it works'],
      suggestedNextAction: 'Run explain-back.',
    });

    expect(generatePractice(log).title).toBe('Verify One AI-Assisted Choice');
  });
});
