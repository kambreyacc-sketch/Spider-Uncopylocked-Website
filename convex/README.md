# Convex backend setup

1. Install dependencies with `npm install`.
2. Authenticate the Convex CLI and run `npx convex dev` from the repository root.
3. Select the existing **Spider Uncopylocked** deployment.
4. Copy the deployment URL into Vercel as `NEXT_PUBLIC_CONVEX_URL`.
5. Deploy Convex functions before enabling the frontend.

## Safety note

Listings submitted through `submitListing` are created with status `pending`; they do not appear in public browsing until reviewed and set to `active`. Before enabling submissions from the public website, enforce a verified Roblox identity in the mutation using Convex auth or a server-verified Roblox session. Do not trust a seller ID supplied by the browser.


Backend deployment is automated by the GitHub Actions workflow when files in `convex/` change on `main`.
