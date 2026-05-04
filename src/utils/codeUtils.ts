export function autoDetectLanguage(code: string): string {
  if (!code) return 'typescript';
  
  const lowerCode = code.toLowerCase();
  
  if (lowerCode.includes('def ') || lowerCode.includes('import numpy') || lowerCode.includes('print(')) {
    return 'python';
  }
  
  if (lowerCode.includes('public static void') || (lowerCode.includes('class ') && lowerCode.includes('{'))) {
    return 'java';
  }
  
  if (lowerCode.includes('function') || lowerCode.includes('const ') || lowerCode.includes('let ')) {
    return 'typescript';
  }
  
  if (lowerCode.includes('<div') || lowerCode.includes('</div>')) {
    return 'html';
  }
  
  if (lowerCode.includes('{') && lowerCode.includes(':')) {
    return 'json';
  }
  
  if (lowerCode.includes('SELECT ') || lowerCode.includes('FROM ')) {
    return 'sql';
  }
  
  if (lowerCode.includes('include') || lowerCode.includes('cout')) {
    return 'cpp';
  }
  
  if (lowerCode.includes('package main') || lowerCode.includes('func ')) {
    return 'go';
  }
  
  return 'typescript';
}