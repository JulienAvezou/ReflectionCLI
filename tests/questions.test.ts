/**
 * Tests for questions module
 */

import { getQuestions, getQuestion, REFLECTION_QUESTIONS } from '../src/questions';

describe('Questions Module', () => {
  test('should return all 7 reflection questions', () => {
    const questions = getQuestions();
    expect(questions).toHaveLength(7);
  });

  test('should have correct structure for each question', () => {
    const questions = getQuestions();
    questions.forEach((q) => {
      expect(q.key).toBeDefined();
      expect(q.prompt).toBeDefined();
      expect(typeof q.prompt).toBe('string');
      expect(q.prompt.length).toBeGreaterThan(0);
    });
  });

  test('should have unique question keys', () => {
    const questions = getQuestions();
    const keys = questions.map((q) => q.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test('should retrieve question by key', () => {
    const question = getQuestion('intent');
    expect(question).toBeDefined();
    expect(question?.key).toBe('intent');
  });

  test('should return undefined for non-existent key', () => {
    const question = getQuestion('nonexistent');
    expect(question).toBeUndefined();
  });

  test('questions should have all 7 expected keys', () => {
    const expectedKeys = [
      'intent',
      'problemSolved',
      'learned',
      'wouldDoDifferently',
      'confidence',
      'testing',
      'technicalDebt',
    ];
    const questions = getQuestions();
    const keys = questions.map((q) => q.key);
    expectedKeys.forEach((key) => {
      expect(keys).toContain(key);
    });
  });
});
