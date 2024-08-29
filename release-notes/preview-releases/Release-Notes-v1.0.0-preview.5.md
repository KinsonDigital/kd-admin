<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd-admin ${RELEASETYPE} Release Notes - v1.0.0-preview.5
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, so your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">New Features ✨</h2>

1. [#45](https://github.com/KinsonDigital/kd-admin/issues/45) - Added a new setting to the prepare release process to prefix release notes files with a value.
> [!Note]
> The name of this setting is `releaseNotesFilePrefix` and is used in the _**prepare-release-settings.json**_ config file.

<h2 align="center" style="font-weight: bold;">Enhancements 💎</h2>

1. [#44](https://github.com/KinsonDigital/kd-admin/issues/44) - Improved the error log message when a file version key with value cannot be found.
2. [#43](https://github.com/KinsonDigital/kd-admin/issues/43) - Added the `--no-lock` option to install process to prevent accidental manipulation of _**deno.lock**_ files deno projects when installing the tool.

<h2 align="center" style="font-weight: bold;">Bug Fixes 🐛</h2>

1. [#44](https://github.com/KinsonDigital/kd-admin/issues/44) - Fixed a bug where when the error logs are incorrect when a GitHub user name is invalid.

<h2 align="center" style="font-weight: bold;">Dependency Updates 📦</h2>

1. [#46](https://github.com/KinsonDigital/kd-admin/pull/46) - Updated the deno `toText` function to version _**0.224.0**_.

<h2 align="center" style="font-weight: bold;">Other 🪧</h2>

1. [#45](https://github.com/KinsonDigital/kd-admin/issues/45) - Updated the deno _**v1.x.x**_ style of permissions to the _**v1.46.x**_ style of permissions in all workflows.
2. [#45](https://github.com/KinsonDigital/kd-admin/issues/45) - Updated the build status check and release workflows to use the new enhanced `deno check` command release in deno version _**v1.46.x**_.
3. [#44](https://github.com/KinsonDigital/kd-admin/issues/44) - Fixed an issue with the if logic for the jobs in the _**sync-pr-to-issue.yml**_ workflow, preventing regular feature branch PRs from running issues to PR syncs.
