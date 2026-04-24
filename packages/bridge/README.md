# Bridge

Typed client layer between the desktop UI and the vendored Hermes runtime.

The first implementation should prefer reusing the existing Hermes
`tui_gateway` JSON-RPC protocol, then wrap it with a stable API for the desktop
frontend.

