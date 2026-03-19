import { createRequire } from "node:module";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as cp from "child_process";
import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as assert from "assert";
import * as github from "@actions/github";
import * as toolCache from "@actions/tool-cache";
import { v4 } from "uuid";
import * as util from "util";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region node_modules/@actions/io/lib/io-util.js
var require_io_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var _a;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getCmdPath = exports.tryGetExecutablePath = exports.isRooted = exports.isDirectory = exports.exists = exports.READONLY = exports.UV_FS_O_EXLOCK = exports.IS_WINDOWS = exports.unlink = exports.symlink = exports.stat = exports.rmdir = exports.rm = exports.rename = exports.readlink = exports.readdir = exports.open = exports.mkdir = exports.lstat = exports.copyFile = exports.chmod = void 0;
	const fs$1 = __importStar(__require("fs"));
	const path$2 = __importStar(__require("path"));
	_a = fs$1.promises, exports.chmod = _a.chmod, exports.copyFile = _a.copyFile, exports.lstat = _a.lstat, exports.mkdir = _a.mkdir, exports.open = _a.open, exports.readdir = _a.readdir, exports.readlink = _a.readlink, exports.rename = _a.rename, exports.rm = _a.rm, exports.rmdir = _a.rmdir, exports.stat = _a.stat, exports.symlink = _a.symlink, exports.unlink = _a.unlink;
	exports.IS_WINDOWS = process.platform === "win32";
	exports.UV_FS_O_EXLOCK = 268435456;
	exports.READONLY = fs$1.constants.O_RDONLY;
	function exists(fsPath) {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				yield exports.stat(fsPath);
			} catch (err) {
				if (err.code === "ENOENT") return false;
				throw err;
			}
			return true;
		});
	}
	exports.exists = exists;
	function isDirectory(fsPath, useStat = false) {
		return __awaiter(this, void 0, void 0, function* () {
			return (useStat ? yield exports.stat(fsPath) : yield exports.lstat(fsPath)).isDirectory();
		});
	}
	exports.isDirectory = isDirectory;
	/**
	* On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
	* \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
	*/
	function isRooted(p) {
		p = normalizeSeparators(p);
		if (!p) throw new Error("isRooted() parameter \"p\" cannot be empty");
		if (exports.IS_WINDOWS) return p.startsWith("\\") || /^[A-Z]:/i.test(p);
		return p.startsWith("/");
	}
	exports.isRooted = isRooted;
	/**
	* Best effort attempt to determine whether a file exists and is executable.
	* @param filePath    file path to check
	* @param extensions  additional file extensions to try
	* @return if file exists and is executable, returns the file path. otherwise empty string.
	*/
	function tryGetExecutablePath(filePath, extensions) {
		return __awaiter(this, void 0, void 0, function* () {
			let stats = void 0;
			try {
				stats = yield exports.stat(filePath);
			} catch (err) {
				if (err.code !== "ENOENT") console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
			}
			if (stats && stats.isFile()) {
				if (exports.IS_WINDOWS) {
					const upperExt = path$2.extname(filePath).toUpperCase();
					if (extensions.some((validExt) => validExt.toUpperCase() === upperExt)) return filePath;
				} else if (isUnixExecutable(stats)) return filePath;
			}
			const originalFilePath = filePath;
			for (const extension of extensions) {
				filePath = originalFilePath + extension;
				stats = void 0;
				try {
					stats = yield exports.stat(filePath);
				} catch (err) {
					if (err.code !== "ENOENT") console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
				}
				if (stats && stats.isFile()) {
					if (exports.IS_WINDOWS) {
						try {
							const directory = path$2.dirname(filePath);
							const upperName = path$2.basename(filePath).toUpperCase();
							for (const actualName of yield exports.readdir(directory)) if (upperName === actualName.toUpperCase()) {
								filePath = path$2.join(directory, actualName);
								break;
							}
						} catch (err) {
							console.log(`Unexpected error attempting to determine the actual case of the file '${filePath}': ${err}`);
						}
						return filePath;
					} else if (isUnixExecutable(stats)) return filePath;
				}
			}
			return "";
		});
	}
	exports.tryGetExecutablePath = tryGetExecutablePath;
	function normalizeSeparators(p) {
		p = p || "";
		if (exports.IS_WINDOWS) {
			p = p.replace(/\//g, "\\");
			return p.replace(/\\\\+/g, "\\");
		}
		return p.replace(/\/\/+/g, "/");
	}
	function isUnixExecutable(stats) {
		return (stats.mode & 1) > 0 || (stats.mode & 8) > 0 && stats.gid === process.getgid() || (stats.mode & 64) > 0 && stats.uid === process.getuid();
	}
	function getCmdPath() {
		var _a;
		return (_a = process.env["COMSPEC"]) !== null && _a !== void 0 ? _a : `cmd.exe`;
	}
	exports.getCmdPath = getCmdPath;
}));
//#endregion
//#region src/wait.ts
var import_io = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.findInPath = exports.which = exports.mkdirP = exports.rmRF = exports.mv = exports.cp = void 0;
	const assert_1 = __require("assert");
	const path$1 = __importStar(__require("path"));
	const ioUtil = __importStar(require_io_util());
	/**
	* Copies a file or folder.
	* Based off of shelljs - https://github.com/shelljs/shelljs/blob/9237f66c52e5daa40458f94f9565e18e8132f5a6/src/cp.js
	*
	* @param     source    source path
	* @param     dest      destination path
	* @param     options   optional. See CopyOptions.
	*/
	function cp(source, dest, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const { force, recursive, copySourceDirectory } = readCopyOptions(options);
			const destStat = (yield ioUtil.exists(dest)) ? yield ioUtil.stat(dest) : null;
			if (destStat && destStat.isFile() && !force) return;
			const newDest = destStat && destStat.isDirectory() && copySourceDirectory ? path$1.join(dest, path$1.basename(source)) : dest;
			if (!(yield ioUtil.exists(source))) throw new Error(`no such file or directory: ${source}`);
			if ((yield ioUtil.stat(source)).isDirectory()) if (!recursive) throw new Error(`Failed to copy. ${source} is a directory, but tried to copy without recursive flag.`);
			else yield cpDirRecursive(source, newDest, 0, force);
			else {
				if (path$1.relative(source, newDest) === "") throw new Error(`'${newDest}' and '${source}' are the same file`);
				yield copyFile(source, newDest, force);
			}
		});
	}
	exports.cp = cp;
	/**
	* Moves a path.
	*
	* @param     source    source path
	* @param     dest      destination path
	* @param     options   optional. See MoveOptions.
	*/
	function mv(source, dest, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			if (yield ioUtil.exists(dest)) {
				let destExists = true;
				if (yield ioUtil.isDirectory(dest)) {
					dest = path$1.join(dest, path$1.basename(source));
					destExists = yield ioUtil.exists(dest);
				}
				if (destExists) if (options.force == null || options.force) yield rmRF(dest);
				else throw new Error("Destination already exists");
			}
			yield mkdirP(path$1.dirname(dest));
			yield ioUtil.rename(source, dest);
		});
	}
	exports.mv = mv;
	/**
	* Remove a path recursively with force
	*
	* @param inputPath path to remove
	*/
	function rmRF(inputPath) {
		return __awaiter(this, void 0, void 0, function* () {
			if (ioUtil.IS_WINDOWS) {
				if (/[*"<>|]/.test(inputPath)) throw new Error("File path must not contain `*`, `\"`, `<`, `>` or `|` on Windows");
			}
			try {
				yield ioUtil.rm(inputPath, {
					force: true,
					maxRetries: 3,
					recursive: true,
					retryDelay: 300
				});
			} catch (err) {
				throw new Error(`File was unable to be removed ${err}`);
			}
		});
	}
	exports.rmRF = rmRF;
	/**
	* Make a directory.  Creates the full path with folders in between
	* Will throw if it fails
	*
	* @param   fsPath        path to create
	* @returns Promise<void>
	*/
	function mkdirP(fsPath) {
		return __awaiter(this, void 0, void 0, function* () {
			assert_1.ok(fsPath, "a path argument must be provided");
			yield ioUtil.mkdir(fsPath, { recursive: true });
		});
	}
	exports.mkdirP = mkdirP;
	/**
	* Returns path of a tool had the tool actually been invoked.  Resolves via paths.
	* If you check and the tool does not exist, it will throw.
	*
	* @param     tool              name of the tool
	* @param     check             whether to check if tool exists
	* @returns   Promise<string>   path to tool
	*/
	function which(tool, check) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!tool) throw new Error("parameter 'tool' is required");
			if (check) {
				const result = yield which(tool, false);
				if (!result) if (ioUtil.IS_WINDOWS) throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`);
				else throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`);
				return result;
			}
			const matches = yield findInPath(tool);
			if (matches && matches.length > 0) return matches[0];
			return "";
		});
	}
	exports.which = which;
	/**
	* Returns a list of all occurrences of the given tool on the system path.
	*
	* @returns   Promise<string[]>  the paths of the tool
	*/
	function findInPath(tool) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!tool) throw new Error("parameter 'tool' is required");
			const extensions = [];
			if (ioUtil.IS_WINDOWS && process.env["PATHEXT"]) {
				for (const extension of process.env["PATHEXT"].split(path$1.delimiter)) if (extension) extensions.push(extension);
			}
			if (ioUtil.isRooted(tool)) {
				const filePath = yield ioUtil.tryGetExecutablePath(tool, extensions);
				if (filePath) return [filePath];
				return [];
			}
			if (tool.includes(path$1.sep)) return [];
			const directories = [];
			if (process.env.PATH) {
				for (const p of process.env.PATH.split(path$1.delimiter)) if (p) directories.push(p);
			}
			const matches = [];
			for (const directory of directories) {
				const filePath = yield ioUtil.tryGetExecutablePath(path$1.join(directory, tool), extensions);
				if (filePath) matches.push(filePath);
			}
			return matches;
		});
	}
	exports.findInPath = findInPath;
	function readCopyOptions(options) {
		return {
			force: options.force == null ? true : options.force,
			recursive: Boolean(options.recursive),
			copySourceDirectory: options.copySourceDirectory == null ? true : Boolean(options.copySourceDirectory)
		};
	}
	function cpDirRecursive(sourceDir, destDir, currentDepth, force) {
		return __awaiter(this, void 0, void 0, function* () {
			if (currentDepth >= 255) return;
			currentDepth++;
			yield mkdirP(destDir);
			const files = yield ioUtil.readdir(sourceDir);
			for (const fileName of files) {
				const srcFile = `${sourceDir}/${fileName}`;
				const destFile = `${destDir}/${fileName}`;
				if ((yield ioUtil.lstat(srcFile)).isDirectory()) yield cpDirRecursive(srcFile, destFile, currentDepth, force);
				else yield copyFile(srcFile, destFile, force);
			}
			yield ioUtil.chmod(destDir, (yield ioUtil.stat(sourceDir)).mode);
		});
	}
	function copyFile(srcFile, destFile, force) {
		return __awaiter(this, void 0, void 0, function* () {
			if ((yield ioUtil.lstat(srcFile)).isSymbolicLink()) {
				try {
					yield ioUtil.lstat(destFile);
					yield ioUtil.unlink(destFile);
				} catch (e) {
					if (e.code === "EPERM") {
						yield ioUtil.chmod(destFile, "0666");
						yield ioUtil.unlink(destFile);
					}
				}
				const symlinkFull = yield ioUtil.readlink(srcFile);
				yield ioUtil.symlink(symlinkFull, destFile, ioUtil.IS_WINDOWS ? "junction" : null);
			} else if (!(yield ioUtil.exists(destFile)) || force) yield ioUtil.copyFile(srcFile, destFile);
		});
	}
})))(), 1);
async function wait(milliseconds) {
	return new Promise((resolve) => {
		if (isNaN(milliseconds)) throw new Error("milliseconds not a number");
		setTimeout(() => resolve("done!"), milliseconds);
	});
}
//#endregion
//#region src/retry-helper.ts
const defaultMaxAttempts = 3;
const defaultMinSeconds = 10;
const defaultMaxSeconds = 20;
var RetryHelper = class {
	maxAttempts;
	minSeconds;
	maxSeconds;
	constructor(maxAttempts = defaultMaxAttempts, minSeconds = defaultMinSeconds, maxSeconds = defaultMaxSeconds) {
		this.maxAttempts = maxAttempts;
		this.minSeconds = Math.floor(minSeconds);
		this.maxSeconds = Math.floor(maxSeconds);
		if (this.minSeconds > this.maxSeconds) throw new Error("min seconds should be less than or equal to max seconds");
	}
	async execute(action) {
		let attempt = 1;
		while (attempt < this.maxAttempts) {
			try {
				return await action();
			} catch (err) {
				core.info(err?.message);
			}
			const seconds = this.getSleepAmount();
			core.info(`Waiting ${seconds} seconds before trying again`);
			await this.sleep(seconds);
			attempt++;
		}
		return await action();
	}
	getSleepAmount() {
		return Math.floor(Math.random() * (this.maxSeconds - this.minSeconds + 1)) + this.minSeconds;
	}
	async sleep(seconds) {
		await wait(seconds * 1e3);
	}
};
async function execute(action) {
	return await new RetryHelper().execute(action);
}
//#endregion
//#region src/github-api-helper.ts
const IS_WINDOWS = process.platform === "win32";
async function downloadRepository(authToken, owner, repo, installDir, ref, commit) {
	if (!ref && !commit) {
		core.info("Determining the default branch");
		ref = await getDefaultBranch(authToken, owner, repo);
	}
	if (!fs.existsSync(installDir)) {
		core.info(`Creating directory: ${installDir}`);
		fs.mkdirSync(installDir, { recursive: true });
	}
	let archiveData = await execute(async () => {
		core.info("Downloading the archive");
		return await downloadArchive(authToken, owner, repo, ref, commit);
	});
	core.info("Writing archive to disk");
	const uniqueId = v4();
	const archivePath = path.join(installDir, `${uniqueId}.tar.gz`);
	await fs.promises.writeFile(archivePath, archiveData);
	archiveData = Buffer.from("");
	core.info("Extracting the archive");
	const extractPath = path.join(installDir, uniqueId);
	await import_io.mkdirP(extractPath);
	if (IS_WINDOWS) await toolCache.extractZip(archivePath, extractPath);
	else await toolCache.extractTar(archivePath, extractPath);
	await import_io.rmRF(archivePath);
	const archiveFileNames = await fs.promises.readdir(extractPath);
	assert.ok(archiveFileNames.length === 1, "Expected exactly one directory inside archive");
	const archiveVersion = archiveFileNames[0];
	core.info(`Resolved version ${archiveVersion}`);
	const tempInstallDir = path.join(extractPath, archiveVersion);
	for (const fileName of await fs.promises.readdir(tempInstallDir)) {
		const sourcePath = path.join(tempInstallDir, fileName);
		const targetPath = path.join(installDir, fileName);
		if (IS_WINDOWS) await import_io.cp(sourcePath, targetPath, { recursive: true });
		else await import_io.mv(sourcePath, targetPath);
	}
	await import_io.rmRF(extractPath);
}
async function getLatestRelease(authToken, owner, repo) {
	core.info("Retrieving the latest release");
	const octokit = github.getOctokit(authToken);
	const params = {
		owner,
		repo
	};
	const result = (await octokit.rest.repos.getLatestRelease(params)).data.tag_name;
	core.info(`Latest release '${result}'`);
	return result;
}
/**
* Looks up the default branch name
*/
async function getDefaultBranch(authToken, owner, repo) {
	return await execute(async () => {
		core.info("Retrieving the default branch name");
		const octokit = github.getOctokit(authToken);
		let result;
		try {
			result = (await octokit.rest.repos.get({
				owner,
				repo
			})).data.default_branch;
			assert.ok(result, "default_branch cannot be empty");
		} catch (err) {
			if (err?.status === 404 && repo.toUpperCase().endsWith(".WIKI")) result = "master";
			else throw err;
		}
		core.info(`Default branch '${result}'`);
		if (!result.startsWith("refs/")) result = `refs/heads/${result}`;
		return result;
	});
}
async function downloadArchive(authToken, owner, repo, ref = "", commit = "") {
	const octokit = github.getOctokit(authToken);
	const params = {
		owner,
		repo,
		ref: commit || ref
	};
	const response = await (IS_WINDOWS ? octokit.rest.repos.downloadZipballArchive : octokit.rest.repos.downloadTarballArchive)(params);
	core.info(`Downloaded archive '${response.url}'`);
	return Buffer.from(response.data);
}
//#endregion
//#region src/installer.ts
const VLANG_GITHUB_OWNER = "vlang";
const VLANG_GITHUB_REPO = "v";
function getInstallDir(arch = os.arch()) {
	const osPlat = os.platform();
	const osArch = translateArchToDistUrl(arch);
	const vlangDir = path.join(os.homedir(), "vlang");
	return path.join(vlangDir, `vlang_${osPlat}_${osArch}`);
}
async function getVlang({ authToken, version, checkLatest, stable, arch = os.arch() }) {
	const installDir = getInstallDir(arch);
	const vBinPath = path.join(installDir, "v");
	if (fs.existsSync(installDir)) return installDir;
	let correctedRef = version;
	if (checkLatest) {
		core.info("Checking latest release...");
		correctedRef = "";
		if (stable) {
			core.info("Checking latest stable release...");
			correctedRef = await getLatestRelease(authToken, VLANG_GITHUB_OWNER, VLANG_GITHUB_REPO);
		}
	}
	core.info(`Downloading vlang ${correctedRef}...`);
	await downloadRepository(authToken, VLANG_GITHUB_OWNER, VLANG_GITHUB_REPO, installDir, correctedRef);
	if (!fs.existsSync(vBinPath)) {
		core.info("Running make...");
		console.log(execSync(`make`, { cwd: installDir }).toString());
	}
	return installDir;
}
function translateArchToDistUrl(arch) {
	return {
		darwin: "macos",
		win32: "windows"
	}[arch.toString()] || arch;
}
//#endregion
//#region src/state-helper.ts
/**
* Indicates whether the POST action is running
*/
const IS_POST = !!process.env["STATE_isPost"];
if (!IS_POST) core.saveState("isPost", "true");
//#endregion
//#region src/main.ts
const execer = util.promisify(cp.exec);
async function run() {
	try {
		const version = resolveVersionInput();
		let arch = core.getInput("architecture");
		if (arch && !version) core.warning("`architecture` is provided but `version` is missing. In this configuration, the version/architecture of Node will not be changed. To fix this, provide `architecture` in combination with `version`");
		if (!arch) arch = os.arch();
		const useCache = strToBoolean(core.getInput("cache") || "true");
		if (useCache && version) {
			const cacheKey = `v-${version}-${os.platform()}-${arch}`;
			const installDir = getInstallDir(arch);
			if (await cache.restoreCache([installDir], cacheKey)) {
				core.info(`Cache hit for V ${version}`);
				core.addPath(installDir);
				const vBinPath = path.join(installDir, "v");
				core.setOutput("bin-path", installDir);
				core.setOutput("v-bin-path", vBinPath);
				core.setOutput("version", version);
				core.setOutput("architecture", arch);
				return;
			}
		}
		const token = core.getInput("token", { required: true });
		const stable = strToBoolean(core.getInput("stable") || "false");
		const binPath = await getVlang({
			authToken: token,
			version,
			checkLatest: strToBoolean(core.getInput("check-latest") || "false"),
			stable,
			arch
		});
		core.info("Adding v to the cache...");
		const installedVersion = await getVersion(binPath);
		const cachedPath = await toolCache.cacheDir(binPath, "v", installedVersion);
		core.info(`Cached v to: ${cachedPath}`);
		core.addPath(cachedPath);
		if (useCache && version) {
			const cacheKey = `v-${version}-${os.platform()}-${arch}`;
			await cache.saveCache([binPath], cacheKey);
			core.info(`Saved V ${version} to cache`);
		}
		const vBinPath = path.join(binPath, "v");
		core.setOutput("bin-path", binPath);
		core.setOutput("v-bin-path", vBinPath);
		core.setOutput("version", installedVersion);
		core.setOutput("architecture", arch);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}
async function cleanup() {}
function resolveVersionInput() {
	let version = core.getInput("version");
	const versionFileInput = core.getInput("version-file");
	if (version && versionFileInput) core.warning("Both version and version-file inputs are specified, only version will be used");
	if (versionFileInput) {
		const versionFilePath = path.join(process.env.GITHUB_WORKSPACE ?? "", versionFileInput);
		if (!fs.existsSync(versionFilePath)) throw new Error(`The specified v version file at: ${versionFilePath} does not exist`);
		version = fs.readFileSync(versionFilePath, "utf8");
	}
	version = parseVersionFile(version);
	core.info(`Resolved ${versionFileInput} as ${version}`);
	return version;
}
function parseVersionFile(contents) {
	let version = contents.trim();
	if (/^v\d/.test(version)) version = version.substring(1);
	return version;
}
function strToBoolean(str) {
	return ![
		"false",
		"no",
		"0",
		"",
		"undefined",
		"null"
	].includes(str.toLowerCase());
}
async function getVersion(binPath) {
	const vBinPath = path.join(binPath, "v");
	const { stdout, stderr } = await execer(`${vBinPath} version`);
	if (stderr !== "") throw new Error(`Unable to get version from ${vBinPath}`);
	if (stdout !== "") return stdout.trim().split(" ")[1];
	core.warning("Unable to get version from v executable.");
	return "0.0.0";
}
if (IS_POST);
else run();
//#endregion
export { cleanup, execer };
