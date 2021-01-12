
import fs from 'fs'
import babel from '@rollup/plugin-babel'
import { version } from './package.json'

const WEBPACK_IMPORT = `
import libWasm from '!!file-loader?name=[name].wasm!./webmscore.lib.wasm-'  // workaround for Webpack 4
import libData from '!!file-loader?name=[name].[ext].wasm!./webmscore.lib.data'
import libMem from '!!file-loader?name=webmscore.lib.mem.wasm!./webmscore.lib.js.mem'
`

const CDN_IMPORT = `
const CDN_PROVIDER = 'https://cdn.jsdelivr.net/npm'
const URL_PREFIX = CDN_PROVIDER + '/webmscore@%VERSION%/' // https://cdn.jsdelivr.net/npm/webmscore@ver

const libWasm = URL_PREFIX + 'webmscore.lib.wasm'
const libData = URL_PREFIX + 'webmscore.lib.data'
const libMem = URL_PREFIX + 'webmscore.lib.js.mem'
`

const WEBPACK_LOCATE_FILE = `
// modern browsers that support WebAssembly 
if (path.endsWith('.wasm')) return new URL(MSCORE_LIB_WASM, MSCORE_BASEURL).href
if (path.endsWith('.data')) return new URL(MSCORE_LIB_DATA, MSCORE_BASEURL).href
if (path.endsWith('.js.mem')) return new URL(MSCORE_LIB_MEM, MSCORE_BASEURL).href
if (path.endsWith('.wasm.js')) throw new Error('WebAssembly is not supported in your browser')
`

const WEBPACK_WORKER_IMPORT = '+ `var MSCORE_LIB_WASM = "${libWasm}", MSCORE_LIB_DATA = "${libData}", MSCORE_LIB_MEM = "${libMem}", MSCORE_BASEURL = "${document.baseURI}";`'

const INJECTION_HINT = (n) => `// %INJECTION_HINT_${n}%`

const REPLACE_IMPORT_META = {
    resolveImportMeta(property) {
        if (property === 'url') {
            return '""';
        }
        return null;
    },
}

const INJECT_WEBPACK_LOCATE_FILE = {
    transform(code) {
        code = code.replace(INJECTION_HINT(0), WEBPACK_LOCATE_FILE)
        code = code.replace(INJECTION_HINT(1), WEBPACK_WORKER_IMPORT)
        return { code }
    }
}

const BYPASS_EVAL_WARNING = {
    transform(code, id) {
        if (id.includes(".lib.js")) {
            code = code.replace(/eval\(/g, "var eval_=eval;eval_(")
        }
        return { code }
    }
}

const BABEL_PLUGIN = babel({
    babelHelpers: 'inline',
    babelrc: false,
    compact: true,
    comments: false,
    presets: [[
        '@babel/preset-env',
        {
            targets: { browsers: "> 0.5%, ie >= 11" },
            exclude: ["transform-typeof-symbol"],
        },
    ]],
    exclude: ['.cache/**'],
})

const INJECT_REGENERATOR_RUNTIME = {
    transform(code) {
        if (code.includes("regeneratorRuntime")) {
            const runtimeModule = fs.readFileSync('node_modules/regenerator-runtime/runtime.js', 'utf-8')
            // use L9-L726 only
            const runtimeFn = runtimeModule.split('\n').slice(8, 725).join("\n")
            code = `var regeneratorRuntime = (function (exports) {\n${runtimeFn}\n})({})\n` + code
        }
        return { code }
    }
}

const WEBPACK_TRANSFORM_PLUGINS = [
    REPLACE_IMPORT_META,
    INJECT_WEBPACK_LOCATE_FILE,
    BABEL_PLUGIN,
    INJECT_REGENERATOR_RUNTIME,
]

export default [
    {
        input: "src/worker.js",
        output: {
            file: ".cache/worker.js",
            format: "iife",
            sourcemap: false,
            banner: "export const WebMscoreWorker = function () { ",
            footer: "}\n",
        },
        plugins: [REPLACE_IMPORT_META, BYPASS_EVAL_WARNING],
    },
    {
        input: "src/worker-helper.js",
        output: {
            file: "webmscore.js",
            format: "iife",
            name: 'WebMscore',
            sourcemap: false,
        },
        plugins: [REPLACE_IMPORT_META],
    },
    {
        input: "src/worker-helper.js",
        output: {
            file: "webmscore.mjs",
            format: "esm",
            sourcemap: false,
        }
    },
    {
        input: "src/nodejs.js",
        output: {
            file: "webmscore.nodejs.cjs",
            format: "cjs",
            exports: "default",
            sourcemap: false,
        },
        plugins: [REPLACE_IMPORT_META, BYPASS_EVAL_WARNING],
    },
    {
        input: "src/worker-helper.js",
        output: {
            file: "webmscore.webpack.mjs",
            format: "esm",
            banner: WEBPACK_IMPORT,
            sourcemap: false,
        },
        plugins: WEBPACK_TRANSFORM_PLUGINS,
    },
    {
        input: "src/worker-helper.js",
        output: {
            file: "webmscore.cdn.mjs",
            format: "esm",
            banner: CDN_IMPORT.replace("%VERSION%", version),
            sourcemap: false,
        },
        plugins: WEBPACK_TRANSFORM_PLUGINS,
    }
]
