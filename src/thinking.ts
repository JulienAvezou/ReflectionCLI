import {
  ArchetypeResult,
  CognitiveArchetype,
  HeatmapAreaScore,
  OutsourcingAuditEntry,
  OutsourcingRisk,
  ReflectionLog,
  ThinkingMode,
  ThinkingScoreDimension,
  ThinkingScoreEntry,
} from './types';

export const THINKING_MODE_PROMPTS: Record<ThinkingMode, string[]> = {
  Explore: [
    'What do I know, what do I assume, and what is still unclear?',
    'What would I ask a senior engineer before choosing an implementation?',
    'What examples or traces would make this problem concrete?',
    'What could make my current understanding wrong?',
  ],
  Challenge: [
    'What is the weakest part of my plan?',
    'What would break if my main assumption changed?',
    'What simpler approach should I compare against?',
    'Ask AI to critique the plan before generating code.',
  ],
  Decide: [
    'What options am I choosing between?',
    'What constraint matters most: speed, clarity, reliability, or reversibility?',
    'What tradeoff am I accepting with the chosen option?',
    'What evidence would change my decision?',
  ],
  Audit: [
    'What behavior needs verification before I trust this?',
    'What edge case would be embarrassing to miss?',
    'Can I explain why the implementation is correct?',
    'What test or manual check would reduce the most risk?',
  ],
  Reflect: [
    'What do I understand now that I did not understand before?',
    'What did AI help with, and what did I outsource?',
    'What reusable pattern can I carry forward?',
    'What is one follow-up learning action?',
  ],
};

export function recommendThinkingMode(goal: string): {
  mode: ThinkingMode;
  reason: string;
  prompts: string[];
} {
  const text = goal.toLowerCase();
  const scores: Record<ThinkingMode, number> = {
    Explore: 0,
    Challenge: 0,
    Decide: 0,
    Audit: 0,
    Reflect: 0,
  };

  const add = (mode: ThinkingMode, words: string[]) => {
    words.forEach((word) => {
      if (text.includes(word)) {
        scores[mode] += 1;
      }
    });
  };

  add('Explore', ['understand', 'learn', 'unknown', 'unclear', 'explore', 'investigate']);
  add('Challenge', ['plan', 'critique', 'wrong', 'challenge', 'assumption', 'review plan']);
  add('Decide', ['decide', 'choose', 'option', 'tradeoff', 'compare', 'between']);
  add('Audit', ['verify', 'test', 'audit', 'correct', 'quality', 'bug', 'edge case']);
  add('Reflect', ['reflect', 'completed', 'done', 'after', 'retrospective', 'learned']);

  const mode = (Object.entries(scores) as Array<[ThinkingMode, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  const reasons: Record<ThinkingMode, string> = {
    Explore:
      'You are still forming the problem model, so discovery questions are more useful than implementation prompts.',
    Challenge:
      'You already have a direction, so the highest-value move is to stress-test assumptions before building.',
    Decide:
      'You are comparing paths, so the work is to make tradeoffs explicit and choose deliberately.',
    Audit:
      'You need confidence in correctness, so verification and edge cases should lead the session.',
    Reflect:
      'The work is complete enough to extract learning and identify remaining comprehension debt.',
  };

  return {
    mode,
    reason: reasons[mode],
    prompts: THINKING_MODE_PROMPTS[mode],
  };
}

export const SCORE_DIMENSIONS: ThinkingScoreDimension[] = [
  'understanding',
  'verification',
  'reflection',
  'decisionQuality',
  'aiDependency',
];

export function calculateThinkingScore(
  answers: Record<ThinkingScoreDimension, number[]>
): Omit<ThinkingScoreEntry, 'id' | 'timestamp' | 'date' | 'project'> {
  const dimensions = SCORE_DIMENSIONS.reduce(
    (result, dimension) => {
      const values = answers[dimension] ?? [];
      if (values.length === 0) {
        throw new Error(`Missing score answers for ${dimension}`);
      }
      values.forEach((value) => {
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          throw new Error('Thinking score answers must be integers from 1 to 5');
        }
      });
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      result[dimension] = Math.round(average * 2);
      return result;
    },
    {} as Record<ThinkingScoreDimension, number>
  );

  const ordered = SCORE_DIMENSIONS.map((dimension) => [dimension, dimensions[dimension]] as const);
  const strongest = [...ordered].sort((a, b) => b[1] - a[1])[0][0];
  const weakest = [...ordered].sort((a, b) => a[1] - b[1])[0][0];
  const total = ordered.reduce((sum, [, score]) => sum + score, 0);

  const actions: Record<ThinkingScoreDimension, string> = {
    understanding:
      'Before asking AI for code, write a two-sentence model of the problem and one uncertainty.',
    verification: 'Add one edge-case check or test before accepting AI-generated output.',
    reflection: 'End the session with one reusable pattern and one remaining question.',
    decisionQuality: 'Record the options and tradeoff before choosing an implementation path.',
    aiDependency: 'Explain the AI suggestion back in your own words before using it.',
  };

  return {
    dimensions,
    total,
    strongest,
    weakest,
    improvementAction: actions[weakest],
  };
}

export function calculateOutsourcingRisk(answers: OutsourcingAuditEntry['answers']): {
  risk: OutsourcingRisk;
  riskAreas: string[];
  suggestedNextAction: string;
} {
  const riskAreas: string[] = [];
  let riskPoints = answers.aiGenerated ? 2 : 0;

  if (!answers.verifiedOutput) {
    riskPoints += 2;
    riskAreas.push('Unverified output');
  }
  if (!answers.canExplain) {
    riskPoints += 2;
    riskAreas.push('Cannot explain why it works');
  }
  if (!answers.testedEdgeCases) {
    riskPoints += 1;
    riskAreas.push('Edge cases not tested');
  }
  if (!answers.comparedAlternatives) {
    riskPoints += 1;
    riskAreas.push('No alternatives compared');
  }
  if (!answers.challengedSuggestion) {
    riskPoints += 1;
    riskAreas.push('AI suggestion was not challenged');
  }

  const risk: OutsourcingRisk = riskPoints >= 6 ? 'High' : riskPoints >= 3 ? 'Medium' : 'Low';
  const suggestedNextAction =
    risk === 'High'
      ? 'Pause implementation and run an explain-back plus one verification pass.'
      : risk === 'Medium'
        ? 'Verify one edge case and challenge the chosen approach before continuing.'
        : 'Keep going, but capture any remaining uncertainty as comprehension debt.';

  return {
    risk,
    riskAreas: riskAreas.length > 0 ? riskAreas : ['No major outsourcing risk detected'],
    suggestedNextAction,
  };
}

export const DEFAULT_HEATMAP_AREAS = [
  'Frontend',
  'Backend',
  'Database',
  'Infrastructure',
  'CI/CD',
  'Testing',
  'Security',
  'Observability',
  'Product Logic',
  'External APIs',
];

export function analyzeHeatmap(
  areas: HeatmapAreaScore[],
  scale: 5 | 10
): {
  areas: HeatmapAreaScore[];
  weakestAreas: HeatmapAreaScore[];
  suggestedFocus: string;
} {
  if (scale !== 5 && scale !== 10) {
    throw new Error('Heatmap scale must be 5 or 10');
  }
  if (areas.length === 0) {
    throw new Error('At least one heatmap area is required');
  }
  areas.forEach((area) => {
    if (!area.area.trim()) {
      throw new Error('Heatmap area names are required');
    }
    if (!Number.isInteger(area.score) || area.score < 1 || area.score > scale) {
      throw new Error(`Heatmap scores must be integers from 1 to ${scale}`);
    }
  });

  const sorted = [...areas].sort((a, b) => a.score - b.score || a.area.localeCompare(b.area));
  const weakestAreas = sorted.slice(0, Math.min(3, sorted.length));
  return {
    areas,
    weakestAreas,
    suggestedFocus: `Spend 15 minutes mapping ${weakestAreas[0].area}: responsibilities, failure modes, and one verification path.`,
  };
}

export function scoreArchetype(
  answers: CognitiveArchetype[]
): Omit<ArchetypeResult, 'id' | 'timestamp' | 'date' | 'project'> {
  if (answers.length === 0) {
    throw new Error('At least one archetype answer is required');
  }

  const validArchetypes: CognitiveArchetype[] = [
    'AI Autopilot',
    'AI Assistant',
    'AI Challenger',
    'AI Architect',
  ];
  const scores: Record<CognitiveArchetype, number> = {
    'AI Autopilot': 0,
    'AI Assistant': 0,
    'AI Challenger': 0,
    'AI Architect': 0,
  };
  answers.forEach((answer) => {
    if (!validArchetypes.includes(answer)) {
      throw new Error(
        'Archetype answers must be one of: AI Autopilot, AI Assistant, AI Challenger, AI Architect'
      );
    }
    scores[answer] += 1;
  });

  const ordered = (Object.entries(scores) as Array<[CognitiveArchetype, number]>).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  const primary = ordered[0][0];
  const secondary = ordered[1][1] > 0 ? ordered[1][0] : undefined;

  const explanations: Record<CognitiveArchetype, string> = {
    'AI Autopilot':
      'You may be letting AI carry too much judgment. The next improvement is verification before acceptance.',
    'AI Assistant':
      'You use AI mainly for execution support while keeping much of the direction yourself.',
    'AI Challenger':
      'You are using AI to test and improve your thinking, which is a strong collaboration pattern.',
    'AI Architect':
      'You use AI strategically while preserving ownership of system direction and tradeoffs.',
  };

  const actions: Record<CognitiveArchetype, string[]> = {
    'AI Autopilot': [
      'Run `reflection audit` after AI-generated changes.',
      'Explain the implementation without looking before merging.',
    ],
    'AI Assistant': [
      'Ask AI to critique your plan, not just execute it.',
      'Record one decision tradeoff before implementation.',
    ],
    'AI Challenger': [
      'Keep a decision journal for contested tradeoffs.',
      'Use heatmaps to find weak system areas.',
    ],
    'AI Architect': [
      'Use weekly practice to keep strategic judgment sharp.',
      'Review outcomes of major decisions after the review date.',
    ],
  };

  return {
    scores,
    primary,
    secondary,
    explanation: explanations[primary],
    improvementActions: actions[primary],
  };
}

export function improvePrompt(input: {
  promptUsed: string;
  goal: string;
  hiddenAssumptions: string;
  unclear: string;
}): string {
  return [
    input.promptUsed.trim(),
    '',
    'Goal:',
    input.goal.trim(),
    '',
    'Constraints and assumptions to check:',
    input.hiddenAssumptions.trim() || 'State assumptions explicitly and ask what could be wrong.',
    '',
    'Clarify before answering:',
    input.unclear.trim() || 'Ask follow-up questions if the request is underspecified.',
    '',
    'Before giving the final answer, explain tradeoffs, risks, and one verification step.',
  ].join('\n');
}

export function generatePractice(log: ReflectionLog): {
  title: string;
  why: string;
  steps: string[];
  reflectionQuestion: string;
  followUpCommand?: string;
} {
  const openDebt = log.comprehensionDebt.filter((item) => item.status === 'open');
  const latestAudit = log.outsourcingAudits[log.outsourcingAudits.length - 1];
  const latestHeatmap = log.heatmapSnapshots[log.heatmapSnapshots.length - 1];
  const weakestScore = log.thinkingScores[log.thinkingScores.length - 1]?.weakest;

  if (latestAudit?.risk === 'High' || latestAudit?.risk === 'Medium') {
    return {
      title: 'Verify One AI-Assisted Choice',
      why: 'Your recent audit suggests some judgment may have been outsourced to AI.',
      steps: [
        'Pick one AI-generated solution from this week.',
        'Explain why it works without looking at the code.',
        'Name two assumptions it makes.',
        'Test or reason through one case where it could fail.',
      ],
      reflectionQuestion: 'What part of this solution do I now understand better than before?',
      followUpCommand: 'reflection audit',
    };
  }

  if (openDebt.length > 0) {
    return {
      title: `Close One Comprehension Gap: ${openDebt[0].title}`,
      why: 'Open comprehension debt is the clearest signal for useful practice.',
      steps: [
        'Restate the gap as a question.',
        'Find the smallest code path or artifact that answers it.',
        'Write a five-sentence explanation in your own words.',
        'Resolve the debt only if the explanation is concrete.',
      ],
      reflectionQuestion: 'Could I explain this clearly to another developer tomorrow?',
      followUpCommand: `reflection debt show ${openDebt[0].id}`,
    };
  }

  if (latestHeatmap?.weakestAreas.length) {
    return {
      title: `Map Your Weakest System Area: ${latestHeatmap.weakestAreas[0].area}`,
      why: 'Your heatmap shows this area has the lowest current comprehension.',
      steps: [
        'List the area responsibilities.',
        'Identify one common failure mode.',
        'Trace one request, job, or data flow through it.',
        'Write down one verification strategy.',
      ],
      reflectionQuestion: 'What would break here if a key assumption changed?',
      followUpCommand: 'reflection heatmap update',
    };
  }

  if (weakestScore) {
    return {
      title: `Strengthen ${weakestScore}`,
      why: 'Your latest thinking score points to this as the most useful habit to practice.',
      steps: [
        'Pick one recent coding task.',
        'Write what good thinking would look like for this dimension.',
        'Do one concrete action that improves it.',
        'Capture the result in a short reflection.',
      ],
      reflectionQuestion: 'What made this thinking habit easier or harder to apply?',
      followUpCommand: 'reflection score',
    };
  }

  return {
    title: 'Explain One Recent AI-Assisted Change',
    why: 'There is not much local history yet, so active recall is the highest-value starting practice.',
    steps: [
      'Pick one AI-assisted change.',
      'Explain the problem it solved.',
      'Explain why the solution works.',
      'Name one assumption and one failure case.',
    ],
    reflectionQuestion:
      'What did I genuinely understand, and what should become comprehension debt?',
    followUpCommand: 'reflection explain',
  };
}
