import tseslint from 'typescript-eslint'

export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['tsconfig.json'],
    },
  },
  files: ['packages/global.d.ts', 'packages/*/src/**/*.ts'],
  extends: [tseslint.configs.base],
  rules: {
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/switch-exhaustiveness-check': 'warn',
    '@typescript-eslint/no-unnecessary-condition': 'warn',
  },
})
