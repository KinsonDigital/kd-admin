/**
 * Represents different deno permissions.
 */
export type DenoPermission = "--allow-read" | "--allow-write" | "--allow-run" | "--allow-net" | "--allow-sys" | "--allow-net";

/**
 * Represents a deno compile target.
 */
export type ActualTarget = "x86_64-unknown-linux-gnu" | "x86_64-pc-windows-msvc" | "x86_64-apple-darwin" | "aarch64-apple-darwin";

/**
 * Represents a target choice.
 */
export type TargetChoice =  | "win-x64" | "linux-x64" | "macos-x64" | "macos-arm";

/**
 * The name of the environment variable that holds the path to the user's local app directory on windows.
 */
export type LocalUserDataEnvVar = "LOCALAPPDATA";

/**
 * The directory path to the user's directory on linux.
 */
export type LinuxUsrDirPath = "/usr";

/**
 * The name of the environment variable that holds the GitHub token for the kd-cli.
 */
export type TokenEnvVarName = "KDCLI_TOKEN";
