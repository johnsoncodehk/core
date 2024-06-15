import { defineConfig } from '@tsslint/config'
import { convertRule } from '@tsslint/eslint'

export default defineConfig({
  rules: {
    'no-unnecessary-type-assertion': convertRule(
      (
        await import(
          './node_modules/@typescript-eslint/eslint-plugin/dist/rules/no-unnecessary-type-assertion.js'
        )
      ).default.default,
      [],
      0,
    ),
    'prefer-nullish-coalescing': convertRule(
      (
        await import(
          './node_modules/@typescript-eslint/eslint-plugin/dist/rules/prefer-nullish-coalescing.js'
        )
      ).default.default,
      [],
      0,
    ),
    'strict-boolean-expressions': convertRule(
      (
        await import(
          './node_modules/@typescript-eslint/eslint-plugin/dist/rules/strict-boolean-expressions.js'
        )
      ).default.default,
      [],
      0,
    ),
    'switch-exhaustiveness-check': convertRule(
      (
        await import(
          './node_modules/@typescript-eslint/eslint-plugin/dist/rules/switch-exhaustiveness-check.js'
        )
      ).default.default,
      [],
      0,
    ),
    'no-unnecessary-condition': convertRule(
      (
        await import(
          './node_modules/@typescript-eslint/eslint-plugin/dist/rules/no-unnecessary-condition.js'
        )
      ).default.default,
      [],
      0,
    ),
  },
})
