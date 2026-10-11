import Link from "next/link";
import SpiderSidebar from "../../components/SpiderSidebar";
const messages:Record<string,string>={
 missing_discord_client_id:"Discord login is not configured on the server: DISCORD_CLIENT_ID is missing.",
 missing_server_configuration:"Discord login is missing server configuration. Check DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and SESSION_SECRET in Vercel Environment Variables.",
 discord_denied:"Discord login was cancelled or denied. Try again and approve the requested identity permission.",
 invalid_discord_oauth_state:"The login security check expired or did not match. Start again from this page.",
 discord_token_exchange_failed:"Discord rejected the login code. Check the redirect URL in the Discord Developer Portal matches the server's DISCORD_REDIRECT_URI exactly.",
 missing_access_token:"Discord did not return a login token. Please try again.",
 discord_profile_fetch_failed:"Spider could not read your Discord profile. Try again in a moment.",
 discord_profile_missing:"Discord returned an incomplete profile. Try again.",
 discord_oauth_unavailable:"Spider could not reach Discord. Try again in a moment."
};
export default async function AuthErrorPage({searchParams}:{searchParams:Promise<{reason?:string}>}){const params=await searchParams;const reason=params.reason||"discord_oauth_unavailable";return <main className="market-shell"><SpiderSidebar/><section className="market-content"><div className="hire-empty auth-error-panel"><h1>Discord login didn’t finish</h1><p>{messages[reason]||"Something interrupted Discord login. Please try again."}</p><Link className="hire-primary" href="/api/auth/discord/login">Try Discord login again</Link><Link className="hire-back" href="/">Back to Spider</Link></div></section></main>}
