/**
 * Standalone tsdown config for the dsh-plugins-mp external plugin (adapted
 * from the dsh-sentinel build, the community-standard external client build):
 * node half as plain ESM for the host Loader, browser half as one CJS closure
 * bundle whose externals are exactly the platform seed modules.
 */
import { defineConfig } from 'tsdown'

const PLUGIN_ID = 'dsh-plugins-mp'

const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  'cordis',
] as const

export default [
  {
    name: `${PLUGIN_ID}/node`,
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    // Committed artifact keeps @deepseek-ai imports external (the dsh-loop
    // convention): `dsh plugin add` installs plugins where the host's own
    // packages resolve, so external users need zero npm installs.
    external: [/^@deepseek-ai\//, 'cordis'],
  },
  {
    name: `${PLUGIN_ID}/client`,
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...PLATFORM_MODULES],
    outputOptions: {
      entryFileNames: 'client.js',
      // The DSH client loader evaluates each plugin bundle inside a factory
      // that must self-register via window.__ModuleLoader__.load — bare CJS
      // output "loads without registering" (see dsh-sentinel's build).
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]
