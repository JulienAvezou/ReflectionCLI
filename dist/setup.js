"use strict";
/**
 * Setup module for installing the pre-commit hook
 */
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
exports.hookExists = hookExists;
exports.installHook = installHook;
exports.uninstallHook = uninstallHook;
exports.verifyHook = verifyHook;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const storage_1 = require("./storage");
const HOOK_SCRIPT = `#!/bin/bash
# git-reflect pre-commit hook
# This hook runs before each commit to prompt reflection

# Connect to user's terminal for interactive input
# Pre-commit hooks need explicit terminal connection
exec </dev/tty
exec git-reflect --hook

exit $?
`;
/**
 * Get the path to the pre-commit hook file
 */
function getHookPath() {
    const gitDir = (0, storage_1.findGitDir)();
    if (!gitDir) {
        throw new Error('Not inside a git repository');
    }
    return path.join(gitDir, 'hooks', 'pre-commit');
}
/**
 * Check if pre-commit hook already exists
 */
function hookExists() {
    try {
        return fs.existsSync(getHookPath());
    }
    catch {
        return false;
    }
}
/**
 * Install the pre-commit hook
 */
function installHook() {
    try {
        const hookPath = getHookPath();
        const hooksDir = path.dirname(hookPath);
        // Ensure hooks directory exists
        if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
        }
        // Check if hook already exists
        if (fs.existsSync(hookPath)) {
            console.log('⚠️  Pre-commit hook already exists. Backing up to pre-commit.backup');
            fs.copyFileSync(hookPath, `${hookPath}.backup`);
        }
        // Write the new hook
        fs.writeFileSync(hookPath, HOOK_SCRIPT, 'utf-8');
        fs.chmodSync(hookPath, 0o755); // Make executable
        // Ensure git-reflect directory exists
        (0, storage_1.ensureGitReflectDir)();
        console.log('✅ git-reflect hook installed successfully!');
        console.log('📝 Next time you commit, you will be prompted with reflection questions.');
    }
    catch (error) {
        throw new Error(`Failed to install hook: ${error}`);
    }
}
/**
 * Uninstall the pre-commit hook
 */
function uninstallHook() {
    try {
        const hookPath = getHookPath();
        if (fs.existsSync(hookPath)) {
            fs.unlinkSync(hookPath);
            console.log('✅ git-reflect hook uninstalled.');
        }
        else {
            console.log('ℹ️  No git-reflect hook found.');
        }
    }
    catch (error) {
        throw new Error(`Failed to uninstall hook: ${error}`);
    }
}
/**
 * Verify the hook is installed and executable
 */
function verifyHook() {
    try {
        const hookPath = getHookPath();
        if (!fs.existsSync(hookPath)) {
            return false;
        }
        const stats = fs.statSync(hookPath);
        // Check if executable (mode & 0o111 != 0)
        return (stats.mode & 0o111) !== 0;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=setup.js.map