import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const sharedSecurityAndQualityRules = {
  // TypeScript strict compiler & oxlint handle undef/unused symbols accurately across type annotations
  'no-undef': 'off',
  'no-unused-vars': 'off',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-throw-literal': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  eqeqeq: ['error', 'always'],
};

const sharedParserOptions = (isTsx) => ({
  parser: babelParser,
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 'latest',
    sourceType: 'module',
    babelOptions: {
      presets: isTsx
        ? [['@babel/preset-typescript'], ['@babel/preset-react', { runtime: 'automatic' }]]
        : [['@babel/preset-typescript']],
    },
  },
});

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'server/**/*.ts', 'server.ts', 'vite.config.ts'],
    languageOptions: sharedParserOptions(false),
    rules: sharedSecurityAndQualityRules,
  },
  {
    files: ['src/**/*.tsx'],
    languageOptions: sharedParserOptions(true),
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...sharedSecurityAndQualityRules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          controlComponents: ['input', 'select', 'textarea'],
          depth: 3,
        },
      ],
    },
  },
  eslintConfigPrettier,
];
