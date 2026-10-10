# Spider Uncopylocked

A standalone Spider Studios platform inspired by developer marketplaces and creator communities.

## Project direction

- Modern dark UI with a clean, responsive design
- Public homepage with featured games, resources, staff, and community links
- Member dashboard and Discord-based identity/role integration (planned)
- VIP resources and Aero/Aero+ entitlements (planned)
- Leaker submissions with Management approval before publication (planned)
- Admin tools with server-side permissions and audit logging (planned)
- AI scripting assistant and Roblox Studio integration (planned)

## Deployment

This repository is intended to connect to its own Vercel project, separate from the existing Spider Studios website.

Integrations (database/auth, billing, Discord bot, file storage, AI) must be configured with provider credentials in Vercel Environment Variables. Never commit secrets to Git.
