
import { createRequire } from 'module'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string'

if (IS_NODE) {

    // cjs require for the native Node.js ES Modules support
    if (typeof require == "undefined") {
        global.require = createRequire(import.meta.url)
    }

    // __dirname for the native Node.js ES Modules support
    if (typeof __dirname == "undefined") {
        global.__dirname = dirname(fileURLToPath(import.meta.url))
    }

    // mock dom objects
    global.window = global.window || { addEventListener() { } }
    global.navigator = global.navigator || {}

}
