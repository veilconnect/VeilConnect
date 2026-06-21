// ESLint 扁平配置（ESLint 9 + typescript-eslint）。
// 目标：抓真实问题（未用变量、隐式 any、no-eval 等），不与 Prettier/风格较劲。
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'server/public/**',
      'dist-harness/**',
      'coverage/**',
      'infra/harness/**',
      '**/*.js',
      '**/*.mjs'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      // React Hooks 规则（依赖正确性是这个 P2P 组件最常见的 bug 来源）
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 安全相关：禁止 eval / 隐式全局
      'no-eval': 'error',
      'no-implied-eval': 'error',
      // 务实降噪：项目大量使用 window.electronAPI 桥接，any 在边界处不可避免
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },
  {
    // 测试里允许 require()（动态 mock / 内置模块）。
    files: ['tests/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
);
