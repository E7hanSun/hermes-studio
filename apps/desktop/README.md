# Desktop App

Electron desktop shell for Hermes Studio.

Current responsibilities:

- render the primary chat and workspace UI
- expose a narrow typed preload API to the React renderer
- launch Hermes through the managed runtime adapter
- provide scaffolded profile, space, and settings data while persistence is being built

Planned responsibilities:

- supervise long-running Hermes services such as gateway, cron, and API server
- handle local files, notifications, tray/menu integration, and app updates
- route approvals and secrets through native desktop prompts
