# Meet the Team setup

The team page uses the Discord Bot API server-side. Never paste a bot token into source files or client-side code.

## 1. Create the bot
1. Open https://discord.com/developers/applications and select **New Application**.
2. Name it something like **Spider Team Directory**.
3. Open **Bot** and select **Add Bot** if needed.
4. Under **Privileged Gateway Intents**, enable **Server Members Intent**. The team endpoint needs guild member data to read `joined_at`.
5. Use **Reset Token** / **Copy** to get the bot token. Keep it private. Do not send it in chat or commit it to GitHub.

## 2. Add it to the Discord server
1. In the Developer Portal, open **OAuth2 → URL Generator**.
2. Select the `bot` scope. For permissions, select **View Channels** (no message permissions are needed for this feature).
3. Open the generated URL and add the bot to your Spider community server.
4. Copy the server's Guild ID: enable Developer Mode in Discord settings, right-click the server icon, then select **Copy Server ID**.
5. Check that the bot remains a member of that server. The team page does not read conversations, DMs, or connections.

## 3. Set Vercel environment variables
In the Vercel project **spider-uncopylocked-website**, open **Settings → Environment Variables** and add:
- `DISCORD_BOT_TOKEN` — the private bot token from the Developer Portal.
- `DISCORD_GUILD_ID` — your Discord server ID.

Apply them to Production (and Preview if you test previews), save, and redeploy. Do not use a `NEXT_PUBLIC_` variable for the token.

## 4. Customize the staff list
Edit `data/team-config.json` in GitHub. Each person has an ID, role list, editable bio, a `nitro` boolean, and an optional `bannerOverride`. Keep IDs as strings. People listed in multiple roles appear in each relevant section. The Developer banner override is already filled in.

## 5. Open and verify
Visit `/team` after the Vercel deployment is Ready. The API endpoint is `/api/team`. Its process-local cache lasts one hour; on serverless deployments, each warm function instance may have its own cache. If the page reports that a member is missing, confirm the ID is correct and that the bot is in the same server. If joined dates are missing, recheck the server ID and Server Members Intent.

## Notes
- Usernames, display names, avatar, banner, public profile flags, and guild join date come from the official Discord API.
- Bios and Nitro indicators are manual config fields because the bot API does not provide the profile bio or Nitro subscription status.
- No user connections are requested.
- The site only displays data; it does not send messages or fetch user tokens.
