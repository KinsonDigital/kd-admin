<h1 align="center" style="color: mediumseagreen;font-weight: bold;">
kd-admin Preview Release Notes - v1.0.0-preview.3
</h1>

<h2 align="center" style="font-weight: bold;">Quick Reminder</h2>

<div align="center">

As with all software, there is always a chance for issues and bugs, especially for preview releases, so your input is greatly appreciated. 🙏🏼
</div>

<h2 align="center" style="font-weight: bold;">Enhancements ✨</h2>

1. [#27](https://github.com/KinsonDigital/kd-admin/issues/27) - Moved the location of the settings files when installing the tool to the _**./dev-tools**_ directory.
   - The tool now looks for the settings files in this directory.
1. [#26](https://github.com/KinsonDigital/kd-admin/issues/26) - Improved release note generation settings.

<h2 align="center" style="font-weight: bold;">Breaking Changes 🧨</h2>

1. [#27](https://github.com/KinsonDigital/kd-admin/issues/27) - Changed where the tool looks and expects the settings.
   - When upgrading, you must move any current settings to the _**./dev-tools**_ directory relative to the repository root directory.
   - Remember to update any path-related settings.
2. [#26](https://github.com/KinsonDigital/kd-admin/issues/26) - Changed the name of the `environment` setting to the name `releaseType`.
