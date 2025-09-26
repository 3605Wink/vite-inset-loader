/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'path';
import { PageConfig, SubPackageConfig } from '../types/plugin';

/**
 * Normalizes paths to POSIX format:
 * 1. Converts Windows separators (\) to POSIX (/)
 * 2. Resolves . and .. segments
 * 3. Collapses duplicate slashes
 * 4. Preserves Windows drive letters (C:/)
 *
 * @example
 * normalizePath('foo\\bar') → 'foo/bar'
 * normalizePath('C:\\path\\..\\file') → 'C:/file'
 * normalizePath('foo//bar') → 'foo/bar'
 */
export function normalizePath(path: string): string {
  // 1. Convert all separators to POSIX
  let posixPath = path.replace(/\\/g, '/');

  // 2. Handle Windows drive letters (preserve C: format)
  const isWindowsDrive = /^[a-z]:/i.test(posixPath);
  if (isWindowsDrive) {
    posixPath = posixPath[0] + ':' + posixPath.slice(1);
  }

  // 3. Split and normalize path segments
  const segments = posixPath.split('/');
  const normalized: string[] = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
        normalized.pop();
      } else if (!isWindowsDrive || normalized.length > 0) {
        // Preserve .. for non-drive absolute paths
        normalized.push('..');
      }
    } else {
      normalized.push(segment);
    }
  }

  // 4. Reconstruct path
  let result = normalized.join('/');

  // 5. Handle root cases
  if (isWindowsDrive && result && !result.startsWith('/')) {
    result = posixPath[0] + ':/' + result;
  } else if (posixPath.startsWith('/') && !result.startsWith('/')) {
    result = '/' + result;
  }

  // 6. Handle empty paths
  return result || (isWindowsDrive ? posixPath[0] + ':/' : '/');
}

// 类型守卫：确保对象是有效的 PageConfig
export function isValidPageConfig(obj: unknown): obj is PageConfig {
  return !!obj && typeof obj === 'object' && 'path' in obj;
}

// 类型守卫：确保对象是有效的 SubPackageConfig
export function isValidSubPackageConfig(obj: unknown): obj is SubPackageConfig {
  return !!obj && typeof obj === 'object' && 'root' in obj && 'pages' in obj && Array.isArray((obj as any).pages);
}

// 优化后的路径格式化函数（添加路径解析确保绝对路径）
export function formatPagePath(root: string, path: string): string {
  return resolve(root, `${path}.vue`).replace(/\\/g, '/');
}
