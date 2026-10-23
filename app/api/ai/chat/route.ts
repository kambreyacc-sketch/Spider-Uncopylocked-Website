import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

function getSession(raw: string | undefined, secret: string) {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, "base64url"); } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      provider?: string; profile?: { id?: string }; issuedAt?: number;
    };
    if (data.provider !== "discord" || !data.profile?.id || !data.issuedAt ||
        Date.now() - data.issuedAt > 7 * 24 * 60 * 60 * 1000 ||
        data.issuedAt > Date.now() + 60_000) return null;
    return data.profile;
  } catch { return null; }
}

export async function GET() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ ready: false, reason: "missing_session_secret" }, { status: 503 });
  const user = getSession((await cookies()).get("spider_session")?.value, secret);
  if (!user) return NextResponse.json({ ready: false, reason: "discord_sign_in_required" }, { status: 401 });
  const hasFreeRouterKey = Boolean(process.env.OPENROUTER_API_KEY);
  const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY);
  const ready = Boolean((process.env.AI_API_KEY || process.env.OPENAI_API_KEY || hasFreeRouterKey || hasGatewayKey) && (process.env.AI_MODEL || hasFreeRouterKey || hasGatewayKey));
  return NextResponse.json({ ready, provider: process.env.AI_PROVIDER_LABEL || "Spider Uncopylocked AI" });
}

export async function POST(request: Request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "The server session secret is not configured." }, { status: 503 });
  const user = getSession((await cookies()).get("spider_session")?.value, secret);
  if (!user) return NextResponse.json({ error: "Sign in with Discord to use Spider Uncopylocked AI." }, { status: 401 });

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || openRouterKey || gatewayKey;
  const usingOpenRouter = Boolean(openRouterKey && !process.env.AI_API_KEY && !process.env.OPENAI_API_KEY);
  const usingGateway = Boolean(!usingOpenRouter && gatewayKey && !process.env.AI_API_KEY && !process.env.OPENAI_API_KEY);
  const model = process.env.AI_MODEL || (usingOpenRouter ? "openrouter/free" : usingGateway ? "openai/gpt-4.1-mini" : "");
  if (!apiKey || !model) {
    return NextResponse.json({
      error: "The AI provider is not configured yet. Add OPENROUTER_API_KEY to use free OpenRouter models, or configure AI_API_KEY and AI_MODEL. Keep all API keys server-side."
    }, { status: 503 });
  }

  let body: { messages?: ChatMessage[]; model?: string; detail?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 30) {
    return NextResponse.json({ error: "Send between 1 and 30 conversation messages." }, { status: 400 });
  }
  const messages: ChatMessage[] = [];
  for (const item of body.messages) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" ||
        !item.content.trim() || item.content.length > 12000) {
      return NextResponse.json({ error: "A message is empty or exceeds the 12,000 character limit." }, { status: 400 });
    }
    messages.push({ role: item.role, content: item.content.trim() });
  }
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "The latest message must be from the user." }, { status: 400 });
  }

  const endpoint = (process.env.AI_API_BASE_URL || (usingOpenRouter ? "https://openrouter.ai/api/v1" : usingGateway ? "https://ai-gateway.vercel.sh/v1" : "https://api.openai.com/v1")).replace(/\/+$/, "");
  const detail = body.detail === "Fast" || body.detail === "Detailed" ? body.detail : "Default";
  const detailInstruction = detail === "Fast"
    ? "Build mode: Fast. Give the smallest complete, working solution; still include full source for every file and essential setup steps."
    : detail === "Detailed"
      ? "Build mode: Detailed. Provide a robust multi-file implementation, important edge cases, security validation, exact Explorer paths, and a practical test checklist."
      : "Build mode: Default. Balance a complete implementation with clear, direct setup instructions."; 
  const system = [
    "You are the Roblox development assistant for Spider Uncopylocked.",
    "Help build complete, secure Roblox systems using Luau. Give working implementations, not vague summaries.",
    "This is a browser-based AI code workspace. Never reference or depend on a Roblox Studio plugin, plugin download, plugin connection, websocket plugin, or automatic Studio sync. Explain how to manually place downloaded scripts in Studio.",
    "When generating code, put every complete source file in its own fenced code block and label it with a filename attribute, e.g. ```lua filename=\"ServerScriptService/Combat.server.lua\". Use the exact Roblox Explorer path as the filename. Use one block per file, never combine multiple files into one block, and do not omit sections of code.",
    "Put setup instructions and the Explorer hierarchy outside the code blocks. Use .server.lua for server Scripts, .client.lua for LocalScripts, and .lua for ModuleScripts when that makes the role clear. Keep file names safe and simple.",
    detailInstruction,
    "When writing code, state the exact Roblox Studio Explorer path for every Script, LocalScript, ModuleScript, RemoteEvent, and UI object.",
    "Keep currency, purchases, permissions, data persistence, and damage authoritative on the server. Validate all client requests and explain exploit prevention.",
    "Ask for existing project context when it materially affects the solution. Never claim to have inspected or modified a Roblox project, run code in Studio, or installed files unless the user supplied that context and a connected tool actually performed the operation.",
    "Do not claim code was installed, tested, or executed in Studio unless a connected tool actually did so. Present file changes clearly and explain any required manual setup. Never suggest that scripts have been installed or synced automatically."
  ].join("\n");
  try {
    const upstream = await fetch(endpoint + "/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], temperature: 0.3 }),
      cache: "no-store",
      signal: AbortSignal.timeout(90_000)
    });
    const data = await upstream.json().catch(() => null) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    } | null;
    if (!upstream.ok) {
      return NextResponse.json({ error: upstream.status === 401 ? "The configured AI API key was rejected." : "The AI provider returned an error: " + (data?.error?.message || upstream.statusText) }, { status: 502 });
    }
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    }
    return NextResponse.json({ reply: reply.trim(), model });
  } catch {
    return NextResponse.json({ error: "Could not reach the AI provider. Check the server-side AI provider URL and try again." }, { status: 502 });
  }
}
