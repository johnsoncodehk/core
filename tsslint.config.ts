import { defineConfig } from '@tsslint/config'
import { convertConfig, createDisableNextLinePlugin } from '@tsslint/eslint'
import { builtinModules } from 'node:module'

const DOMGlobals = ['window', 'document']
const NodeGlobals = ['module', 'require']

const banConstEnum = {
  selector: 'TSEnumDeclaration[const=true]',
  message:
    'Please use non-const enums. This project automatically inlines enums.',
}

const enableTypeAwareRules =
  process.argv.includes('--type-aware-rules') ||
  process.argv.includes('--useNodeIpc') // In IDE

export default defineConfig([
  {
    plugins: [createDisableNextLinePlugin(enableTypeAwareRules)],
    rules: convertConfig({
      'no-debugger': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      // most of the codebase are expected to be env agnostic
      'no-restricted-globals': ['error', ...DOMGlobals, ...NodeGlobals],

      'no-restricted-syntax': [
        'error',
        banConstEnum,
        {
          selector: 'ObjectPattern > RestElement',
          message:
            'Our output target is ES2016, and object rest spread results in ' +
            'verbose helpers and should be avoided.',
        },
        {
          selector: 'ObjectExpression > SpreadElement',
          message:
            'esbuild transpiles object spread into very verbose inline helpers.\n' +
            'Please use the `extend` helper from @vue/shared instead.',
        },
        {
          selector: 'AwaitExpression',
          message:
            'Our output target is ES2016, so async/await syntax should be avoided.',
        },
        {
          selector: 'ChainExpression',
          message:
            'Our output target is ES2016, and optional chaining results in ' +
            'verbose helpers and should be avoided.',
        },
      ],
      'sort-imports': ['error', { ignoreDeclarationSort: true }],

      'import-x/no-nodejs-modules': [
        'error',
        { allow: builtinModules.map(mod => `node:${mod}`) },
      ],
      // This rule enforces the preference for using '@ts-expect-error' comments in TypeScript
      // code to indicate intentional type errors, improving code clarity and maintainability.
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      // Enforce the use of 'import type' for importing types
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      // Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Type-aware rules
      '@typescript-eslint/no-unnecessary-type-assertion': [
        enableTypeAwareRules ? 'error' : 'off',
        { typesToIgnore: ['any'] },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
    }),
  },

  // tests, no restrictions (runs in Node / Vitest with jsdom)
  {
    include: [
      '**/__tests__/**',
      'packages-private/dts-test/**',
      'packages-private/dts-build-test/**',
    ],
    rules: convertConfig({
      '@vitest/no-disabled-tests': 'error',
      '@vitest/no-focused-tests': 'error',
    }),
    plugins: [
      () => ({
        resolveRules(fileName, rules) {
          delete rules['no-console']
          delete rules['no-restricted-globals']
          delete rules['no-restricted-syntax']
          return rules
        },
      }),
    ],
  },

  // shared, may be used in any env
  {
    include: ['packages/shared/**'],
    plugins: [
      () => ({
        resolveRules(fileName, rules) {
          delete rules['no-restricted-globals']
          return rules
        },
      }),
    ],
  },

  // Packages targeting Node
  {
    include: [
      'packages/compiler-sfc/**',
      'packages/compiler-ssr/**',
      'packages/server-renderer/**',
    ],
    rules: convertConfig({
      'no-restricted-globals': ['error', ...DOMGlobals],
      'no-restricted-syntax': ['error', banConstEnum],
    }),
  },

  // Packages targeting DOM
  {
    include: [
      'packages/runtime-core/**',
      'packages/runtime-dom/**',
      'packages/vue/**',
      'packages/vue-compat/**',
    ],
    rules: convertConfig({
      'no-restricted-globals': ['error', ...NodeGlobals],
    }),
  },

  // Private package, browser only + no syntax restrictions
  {
    include: [
      'packages-private/template-explorer/**',
      'packages-private/sfc-playground/**',
    ],
    rules: convertConfig({
      'no-restricted-globals': ['error', ...NodeGlobals],
      'no-restricted-syntax': ['error', banConstEnum],
    }),
    plugins: [
      () => ({
        resolveRules(fileName, rules) {
          delete rules['no-console']
          return rules
        },
      }),
    ],
  },

  // JavaScript files
  {
    include: ['**/*.js'],
    rules: convertConfig({
      // We only do `no-unused-vars` checks for js files, TS files are checked by TypeScript itself.
      'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
    }),
  },

  // Node scripts
  {
    include: [
      'rollup*.config.js',
      'scripts/**',
      './*.js',
      './*.ts',
      'packages/*/*.js',
      'packages/vue/*/*.js',
    ],
    rules: convertConfig({
      'no-restricted-syntax': ['error', banConstEnum],
    }),
    plugins: [
      () => ({
        resolveRules(fileName, rules) {
          delete rules['no-restricted-globals']
          delete rules['no-console']
          return rules
        },
      }),
    ],
  },

  // Import nodejs modules in compiler-sfc
  {
    include: ['packages/compiler-sfc/src/**'],
    rules: convertConfig({
      'import-x/no-nodejs-modules': ['error', { allow: builtinModules }],
    }),
  },
])
