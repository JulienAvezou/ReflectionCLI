import { formatDebtList } from '../src/format';
import { generateWeeklyReport } from '../src/report';
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

describe('Weekly report generation', () => {
  test('should handle empty state gracefully', () => {
    const report = generateWeeklyReport(baseLog(), {
      since: '2026-05-25',
      until: '2026-06-02',
    });

    expect(report).toContain('# Weekly Thinking Report');
    expect(report).toContain('- No projects captured this week.');
    expect(report).toContain('- No open comprehension debt.');
    expect(report).toContain('- No AI usage reflections captured this week.');
  });

  test('should generate a weekly report from local entries', () => {
    const log = baseLog();
    log.entries.push({
      timestamp: '2026-06-01T12:00:00.000Z',
      date: '2026-06-01',
      branchName: 'feature/reflection',
      commitMessage: 'Add reflection commands',
      answers: {
        intent: 'Improve reflection workflow',
        problemSolved: 'Missing learning flow',
        learned: 'Small command modules are easy to test.',
        wouldDoDifferently: 'Start with reports earlier.',
        confidence: 'Medium',
        testing: 'Unit tests',
        technicalDebt: 'None',
      },
    });
    log.comprehensionDebt.push(
      {
        id: 'debt-001',
        title: 'Understand prompt validation',
        context: 'Need to review inquirer behavior.',
        project: 'cli',
        tags: ['prompts'],
        status: 'open',
        createdAt: '2026-06-01T12:00:00.000Z',
        date: '2026-06-01',
      },
      {
        id: 'debt-002',
        title: 'Understand report grouping',
        tags: ['reports'],
        status: 'resolved',
        createdAt: '2026-06-01T12:00:00.000Z',
        date: '2026-06-01',
        resolvedAt: '2026-06-02T12:00:00.000Z',
      }
    );
    log.learningEntries.push({
      id: 'learn-001',
      timestamp: '2026-06-02T12:00:00.000Z',
      date: '2026-06-02',
      project: 'cli',
      source: 'manual',
      sections: {
        whatIUnderstood: 'The storage layer owns normalization.',
        whatAiHelpedWith: 'AI helped draft edge cases.',
        whatIMayHaveOutsourcedToAi: 'I outsourced some parser details.',
        whatIStillDoNotFullyUnderstand: 'Prompt validation',
        reusablePattern: 'Keep CLI handlers thin.',
        explainBackQuestion: 'Can I explain the report date range?',
        nextLearningAction: 'Read inquirer prompt docs.',
      },
    });
    log.explainBackEntries.push({
      id: 'explain-001',
      timestamp: '2026-06-02T12:00:00.000Z',
      date: '2026-06-02',
      topic: 'Report aggregation',
      canExplainWithoutCode: 'Mostly',
      tradeoff: 'Simple grouping over analytics.',
      changedAssumption: 'Long histories may need filters.',
      explanationForDeveloper: 'It scans the local log.',
      assessment: 'incomplete',
      createdDebtId: 'debt-001',
    });

    const report = generateWeeklyReport(log, {
      since: '2026-05-27',
      until: '2026-06-02',
    });

    expect(report).toContain('- cli');
    expect(report).toContain('- feature/reflection');
    expect(report).toContain('- debt-001: Understand prompt validation');
    expect(report).toContain('- debt-002: Understand report grouping');
    expect(report).toContain('- AI helped draft edge cases.');
    expect(report).toContain('- Report aggregation');
  });
});

describe('Debt formatting', () => {
  test('should handle empty debt lists', () => {
    expect(formatDebtList([])).toBe('No comprehension debt items found.');
  });
});
