import { PluginInstance, defineConfig, definePlugin } from '@tsslint/config'
import { convertRule } from '@tsslint/eslint'
import minimatch from 'minimatch'
import { builtinModules } from 'node:module'
import path from 'node:path'

// Rules
import vitestConfig from 'eslint-plugin-vitest'
import noNodejsModulesRule from './node_modules/eslint-plugin-import-x/lib/rules/no-nodejs-modules.js'
import noRestrictedGlobalsRule from './node_modules/eslint/lib/rules/no-restricted-globals.js'
import noRestrictedSyntaxRule from './node_modules/eslint/lib/rules/no-restricted-syntax.js'
import noUnusedVarsRule from './node_modules/eslint/lib/rules/no-unused-vars.js'

const DOMGlobals = ['window', 'document']
const NodeGlobals = ['module', 'require']
const banConstEnum = {
  selector: 'TSEnumDeclaration[const=true]',
  message:
    'Please use non-const enums. This project automatically inlines enums.',
}

export default defineConfig({
  rules: {
    'no-debugger': convertRule((await import('./node_modules/eslint/lib/rules/no-debugger.js')).default),
    'no-console': convertRule((await import('./node_modules/eslint/lib/rules/no-console.js')).default, [{ allow: ['warn', 'error', 'info'] }]),
    // most of the codebase are expected to be env agnostic
    'no-restricted-globals': convertRule(noRestrictedGlobalsRule, [...DOMGlobals, ...NodeGlobals]),

    'no-restricted-syntax': convertRule(noRestrictedSyntaxRule, [
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
    ]),
    'sort-imports': convertRule((await import('./node_modules/eslint/lib/rules/sort-imports.js')).default, [{ ignoreDeclarationSort: true }]),

    'import-x/no-nodejs-modules': convertRule(noNodejsModulesRule, [{ allow: builtinModules.map(mod => `node:${mod}`) }], undefined, { settings: { 'import-x/core-modules': [] } }),
    // This rule enforces the preference for using '@ts-expect-error' comments in TypeScript
    // code to indicate intentional type errors, improving code clarity and maintainability.
    '@typescript-eslint/prefer-ts-expect-error': convertRule((await import('./node_modules/@typescript-eslint/eslint-plugin/dist/rules/prefer-ts-expect-error.js')).default.default),
    // Enforce the use of 'import type' for importing types
    '@typescript-eslint/consistent-type-imports': convertRule((await import('./node_modules/@typescript-eslint/eslint-plugin/dist/rules/consistent-type-imports.js')).default.default, [{
      fixStyle: 'inline-type-imports',
      disallowTypeAnnotations: false,
    }]),
    '@typescript-eslint/no-import-type-side-effects': convertRule((await import('./node_modules/@typescript-eslint/eslint-plugin/dist/rules/no-import-type-side-effects.js')).default.default),
  },
  plugins: [
    createIgnoreNextLinePlugin(/\/\/ eslint-disable-next-line/g),
    createESLintDisablePlugin(),

    createOverridePlugin(['**/__tests__/**', 'packages/dts-test/**'], {
      resolveRules(fileName, rules) {
        delete rules['no-console']
        delete rules['no-restricted-globals']
        delete rules['no-restricted-syntax']
        rules['vitest/no-disabled-tests'] = convertRule(vitestConfig.rules['no-disabled-tests'])
        rules['vitest/no-focused-tests'] = convertRule(vitestConfig.rules['no-focused-tests'])
        return rules
      },
    }),

    // shared, may be used in any env
    createOverridePlugin(['packages/shared/**', 'eslint.config.js'], {
      resolveRules(fileName, rules) {
        delete rules['no-restricted-globals']
        return rules
      },
    }),

    // Packages targeting DOM
    createOverridePlugin(['packages/{vue,vue-compat,runtime-dom}/**'], {
      resolveRules(fileName, rules) {
        rules['no-restricted-globals'] = convertRule(noRestrictedGlobalsRule, NodeGlobals)
        return rules
      },
    }),

    // Packages targeting Node
    createOverridePlugin(['packages/{compiler-sfc,compiler-ssr,server-renderer}/**'], {
      resolveRules(fileName, rules) {
        rules['no-restricted-globals'] = convertRule(noRestrictedGlobalsRule, DOMGlobals)
        rules['no-restricted-syntax'] = convertRule(noRestrictedSyntaxRule, [banConstEnum])
        return rules
      },
    }),

    // Private package, browser only + no syntax restrictions
    createOverridePlugin(['packages/template-explorer/**', 'packages/sfc-playground/**'], {
      resolveRules(fileName, rules) {
        rules['no-restricted-globals'] = convertRule(noRestrictedGlobalsRule, NodeGlobals)
        rules['no-restricted-syntax'] = convertRule(noRestrictedSyntaxRule, [banConstEnum])
        delete rules['no-console']
        return rules
      },
    }),

    // JavaScript files
    createOverridePlugin(['**/*.js'], {
      resolveRules(fileName, rules) {
        rules['no-unused-vars'] = convertRule(noUnusedVarsRule, [{ vars: 'all', args: 'none' }])
        return rules
      },
    }),

    // Node scripts
    createOverridePlugin([
      'eslint.config.js',
      'rollup*.config.js',
      'scripts/**',
      './*.{js,ts}',
      'packages/*/*.js',
      'packages/vue/*/*.js',
    ], {
      resolveRules(fileName, rules) {
        delete rules['no-restricted-globals']
        rules['no-restricted-syntax'] = convertRule(noRestrictedSyntaxRule, [banConstEnum])
        delete rules['no-console']
        return rules
      },
    }),

    // Import nodejs modules in compiler-sfc
    createOverridePlugin(['packages/compiler-sfc/src/**'], {
      resolveRules(fileName, rules) {
        rules['import-x/no-nodejs-modules'] = convertRule(noNodejsModulesRule, [{ allow: builtinModules }], undefined, { settings: { 'import-x/core-modules': [] } })
        return rules
      },
    }),
  ],
})

function createOverridePlugin(pattern: string[], hooks: PluginInstance) {
  return definePlugin(({ configFile }) => {
    const basePath = path.dirname(configFile)
    const resolvedPattern = pattern.map(p => path.resolve(basePath, p))
    return {
      resolveRules(fileName, rules) {
        if (resolvedPattern.some(pattern => minimatch.minimatch(fileName, pattern))) {
          return hooks.resolveRules?.(fileName, rules) ?? rules
        }
        return rules
      },
    }
  })
}

function createIgnoreNextLinePlugin(regex: RegExp) {
  return definePlugin(({ languageService }) => ({
    resolveDiagnostics(fileName, results) {
      if (!results.some(error => error.source === 'tsslint')) {
        return results
      }
      const sourceFile = languageService.getProgram()?.getSourceFile(fileName)
      if (!sourceFile) {
        return results
      }
      const comments = [...sourceFile.text.matchAll(regex)]
      const lines = new Set(comments.map(comment => sourceFile.getLineAndCharacterOfPosition(comment.index).line))
      return results.filter(error => error.source !== 'tsslint' || !lines.has(sourceFile.getLineAndCharacterOfPosition(error.start).line - 1))
    },
  }))
}

function createESLintDisablePlugin() {
  return definePlugin(({ languageService }) => ({
    resolveDiagnostics(fileName, results) {
      if (!results.some(error => error.source === 'tsslint')) {
        return results
      }
      const sourceFile = languageService.getProgram()?.getSourceFile(fileName)
      if (!sourceFile) {
        return results
      }
      const comments = sourceFile.text.matchAll(/\/\* eslint-disable (?<rule>\S*) \*\//g)
      for (const comment of comments) {
        const rule = comment.groups!['rule']
        results = results.filter(error => error.source !== 'tsslint' || (error.code as string | number) !== rule)
      }
      return results
    },
  }))
}
