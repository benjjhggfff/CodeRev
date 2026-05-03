import type { ReviewDimension, ReviewResponse } from '../types/review';

export type StreamingCallback = (chunk: string) => void;

type MockStreamingParams = {
  code: string;
  dimensions: ReviewDimension[];
  onChunk: StreamingCallback;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createMockResponse = ({ code, dimensions }: Pick<MockStreamingParams, 'code' | 'dimensions'>): ReviewResponse => {
  const hasInnerHTML = code.includes('innerHTML');
  const hasLoopInLoop = /(for\s*\(.*\)\s*\{[\s\S]*for\s*\()/m.test(code);

  const issues: ReviewResponse['issues'] = [];

  if (dimensions.includes('Security') && hasInnerHTML) {
    issues.push({
      severity: 'critical',
      lineNumber: null,
      description:
        'Potential XSS risk: assigning untrusted content to innerHTML without sanitization.',
      fixExample:
        'Use textContent for plain text or sanitize HTML with a trusted sanitizer before rendering.',
    });
  }

  if (dimensions.includes('Performance') && hasLoopInLoop) {
    issues.push({
      severity: 'optimization',
      lineNumber: null,
      description: 'Nested loops detected; this may degrade performance on larger inputs.',
      fixExample:
        'Use a lookup map/set or precomputed index to reduce the complexity from O(n^2) where possible.',
    });
  }
  if (dimensions.includes('Accessibility')) {
    issues.push({
      severity: 'suggestion',
      lineNumber: null,
      description: 'Consider using aria-label for accessibility.',
      fixExample: 'Use aria-label for accessibility.',
      });
    }
  
  if (dimensions.includes('Code Quality')) {
    issues.push({
      severity: 'suggestion',
      lineNumber: null,
      description: 'Consider using a linter to enforce code quality.',
      fixExample: 'Use a linter to enforce code quality.',
    });
  }
  if (dimensions.includes('Maintainability')) {
    issues.push({
      severity: 'suggestion',
      lineNumber: null,
      description:
        'Consider splitting complex logic into small pure functions to improve readability and testability.',
      fixExample:
        'Extract validation, transformation, and rendering steps into separate named functions.',
    });
  }

  return {
    summary:
      issues.length === 0
        ? 'No major issues found for the selected dimensions.'
        : `Found ${issues.length} issue(s) across ${dimensions.join(', ')}.`,
    issues,
  };
};

export const mockStreamingResponse = async ({
  code,
  dimensions,
  onChunk,
}: MockStreamingParams): Promise<void> => {
  const payload = JSON.stringify(createMockResponse({ code, dimensions }), null, 2);

  for (const char of payload) {
    onChunk(char);
    await delay(8);
  }
};
