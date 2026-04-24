# Desktop App

Electron desktop shell for Hermes Studio.

Current responsibilities:

- render the primary chat and workspace UI
- expose a narrow typed preload API to the React renderer
- provide mock runtime, profile, space, and settings data for the first UI pass

Planned responsibilities:

- launch and supervise the vendored Hermes runtime
- handle local files, notifications, tray/menu integration, and app updates
- route approvals and secrets through native desktop prompts
