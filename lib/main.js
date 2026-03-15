"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.execer = void 0;
exports.cleanup = cleanup;
exports.run = run;
const cache = __importStar(require("@actions/cache"));
const core = __importStar(require("@actions/core"));
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const installer = __importStar(require("./installer"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const tc = __importStar(require("@actions/tool-cache"));
const util = __importStar(require("util"));
const state_helper_1 = require("./state-helper");
const github_api_helper_1 = require("./github-api-helper");
exports.execer = util.promisify(cp.exec);
async function run() {
    try {
        //
        // Version is optional.  If supplied, install / use from the tool cache
        // If not supplied then task is still used to setup proxy, auth, etc...
        //
        const version = resolveVersionInput();
        let arch = core.getInput('architecture');
        // if architecture supplied but version is not
        // if we don't throw a warning, the already installed x64 node will be used which is not probably what user meant.
        if (arch && !version) {
            core.warning('`architecture` is provided but `version` is missing. In this configuration, the version/architecture of Node will not be changed. To fix this, provide `architecture` in combination with `version`');
        }
        if (!arch) {
            arch = os.arch();
        }
        const token = core.getInput('token', { required: true });
        const stable = strToBoolean(core.getInput('stable') || 'false');
        const checkLatest = strToBoolean(core.getInput('check-latest') || 'false');
        const cacheEnabled = strToBoolean(core.getInput('cache') || 'true');
        const installDir = installer.getInstallDir(arch);
        const translatedArch = installer.translateArchToDistUrl(arch);
        // Build a cache key without making any API calls.
        // For checkLatest+stable we use a fixed "stable" suffix so we can check
        // the cache before resolving the exact version from the API.
        // HEAD builds (checkLatest && !stable) have no stable key, so skip caching.
        let cacheKey = null;
        if (!checkLatest && version) {
            cacheKey = `setup-v-${os.platform()}-${translatedArch}-${version}`;
        }
        else if (checkLatest && stable) {
            cacheKey = `setup-v-${os.platform()}-${translatedArch}-stable`;
        }
        // --- cache restore (before any API calls) ---
        if (cacheEnabled && cacheKey) {
            core.info(`Checking cache for key: ${cacheKey}`);
            const cacheHit = await cache.restoreCache([installDir], cacheKey);
            if (cacheHit) {
                core.info('Cache hit — skipping download');
                const installedVersion = await getVersion(installDir);
                const cachedPath = await tc.cacheDir(installDir, 'v', installedVersion);
                core.addPath(cachedPath);
                core.setOutput('bin-path', installDir);
                core.setOutput('v-bin-path', path.join(installDir, 'v'));
                core.setOutput('version', installedVersion);
                core.setOutput('architecture', arch);
                return;
            }
            core.info('Cache miss — proceeding with download');
        }
        // --- resolve ref (API call only on cache miss) ---
        let resolvedRef;
        if (checkLatest && stable) {
            core.info('Checking latest stable release...');
            resolvedRef = await (0, github_api_helper_1.getLatestRelease)(token, 'vlang', 'v');
        }
        else if (!checkLatest) {
            resolvedRef = version || undefined;
        }
        // checkLatest && !stable → resolvedRef stays undefined (download HEAD)
        // --- install ---
        const binPath = await installer.getVlang({
            authToken: token,
            version,
            checkLatest,
            stable,
            arch,
            resolvedRef
        });
        core.info('Adding v to the tool cache...');
        const installedVersion = await getVersion(binPath);
        const cachedPath = await tc.cacheDir(binPath, 'v', installedVersion);
        core.info(`Cached v to: ${cachedPath}`);
        core.addPath(cachedPath);
        core.setOutput('bin-path', binPath);
        core.setOutput('v-bin-path', path.join(binPath, 'v'));
        core.setOutput('version', installedVersion);
        core.setOutput('architecture', arch);
        // --- cache save ---
        if (cacheEnabled && cacheKey) {
            core.info(`Saving cache with key: ${cacheKey}`);
            await cache.saveCache([installDir], cacheKey);
        }
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
async function cleanup() {
    // @todo: implement
}
function resolveVersionInput() {
    let version = core.getInput('version');
    const versionFileInput = core.getInput('version-file');
    if (version && versionFileInput) {
        core.warning('Both version and version-file inputs are specified, only version will be used');
    }
    if (versionFileInput) {
        const versionFilePath = path.join(process.env.GITHUB_WORKSPACE, versionFileInput);
        if (!fs.existsSync(versionFilePath)) {
            throw new Error(`The specified v version file at: ${versionFilePath} does not exist`);
        }
        version = fs.readFileSync(versionFilePath, 'utf8');
    }
    version = parseVersionFile(version);
    core.info(`Resolved ${versionFileInput} as ${version}`);
    return version;
}
function parseVersionFile(contents) {
    let version = contents.trim();
    if (/^v\d/.test(version)) {
        version = version.substring(1);
    }
    return version;
}
function strToBoolean(str) {
    const falsyValues = ['false', 'no', '0', '', 'undefined', 'null'];
    return !falsyValues.includes(str.toLowerCase());
}
async function getVersion(binPath) {
    const vBinPath = path.join(binPath, 'v');
    const { stdout, stderr } = await (0, exports.execer)(`${vBinPath} version`);
    if (stderr !== '') {
        throw new Error(`Unable to get version from ${vBinPath}`);
    }
    if (stdout !== '') {
        return stdout.trim().split(' ')[1];
    }
    core.warning('Unable to get version from v executable.');
    return '0.0.0';
}
if (state_helper_1.IS_POST) {
    cleanup();
}
else {
    run();
}
