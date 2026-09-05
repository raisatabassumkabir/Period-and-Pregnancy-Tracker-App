import path from 'node:path';
import { fileURLToPath } from 'node:url';

import expoConfig from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import testingLibrary from 'eslint-plugin-testing-library';
import unicornPlugin from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared rules that don't require type information
const sharedRules = {
  // Prettier
  'prettier/prettier': 'warn',

  // Unicorn - filename case
  'unicorn/filename-case': [
    'error',
    {
      case: 'kebabCase',
      ignore: ['/android', '/ios'],
    },
  ],

  // Function limits
  'max-params': ['error', 3],
  'max-lines-per-function': ['error', 290],

  // React rules
  'react/display-name': 'off',
  'react/no-inline-styles': 'off',
  'react/destructuring-assignment': 'off',
  'react/require-default-props': 'off',

  // React Hooks
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // React Compiler
  'react-compiler/react-compiler': 'error',

  // Import rules
  'import/prefer-default-export': 'off',

  // Tailwind CSS
  'tailwindcss/classnames-order': [
    'warn',
    {
      officialSorting: true,
    },
  ],
  'tailwindcss/no-custom-classname': 'off',

  // Import sorting
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',

  // Unused imports
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
};

// Shared plugins
const sharedPlugins = {
  prettier: prettierPlugin,
  unicorn: unicornPlugin,
  'unused-imports': unusedImports,
  tailwindcss: tailwindcss,
  'simple-import-sort': simpleImportSort,
  'react-compiler': reactCompilerPlugin,
};

export default [
  // Global ignores - must come first
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'ios/**',
      'android/**',
      'dist/**',
      'build/**',
      // Config files in root
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'tailwind.config.js',
      'commitlint.config.js',
      'lint-staged.config.js',
      '.prettierrc.js',
      'env.js',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
      'jest-setup.ts',
      // Directories to ignore
      'scripts/**',
      'cli/**',
      '__mocks__/**',
      'docs/**',
      'prompts/**',
      'assets/**',
      // Translation files (linted separately with eslint-plugin-i18n-json)
      'src/translations/**',
    ],
  },

  // Expo config (includes ESLint recommended, TypeScript, React, React Hooks, Import)
  ...expoConfig,

  // Prettier config (disables conflicting rules)
  prettierConfig,

  // Configuration for TypeScript files (with type-aware rules)
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      ...sharedPlugins,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...sharedRules,

      // TypeScript-specific rules (require type information)
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',

      // Import cycle detection (can be slow but works with types)
      'import/no-cycle': ['error', { maxDepth: Infinity }],
    },
  },

  // Configuration for JavaScript files (without type-aware rules)
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: sharedPlugins,
    rules: sharedRules,
  },

  // Configuration for testing files
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
    },
  },
];
