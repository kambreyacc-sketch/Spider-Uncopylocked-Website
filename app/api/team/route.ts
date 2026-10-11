import { NextResponse } from "next/server";
import teamConfig from "@/data/team-config.json";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type ConfigMember = {
  id: string;
  roles: string[];
  bio: string;
  nitro: boolean;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerOverride?: string;
  accentColor?: string;
};
const ROLE_ORDER = ["Owners", "Developer", "Deputy Manager", "Community Managers", "Admins", "Mods", "Leakers"];

export async function GET() {
  const profiles = (teamConfig as ConfigMember[]).map((person) => ({
    ...person,
    // Use manually configured profile details; never invent Discord names.
    username: person.username?.trim() || person.id,
    displayName: person.displayName?.trim() || "Add display name",
    avatarUrl: person.avatarUrl?.trim() || "https://cdn.discordapp.com/embed/avatars/0.png",
    bannerUrl: person.bannerUrl?.trim() || person.bannerOverride || null,
    accentColor: person.accentColor || null,
    joinedAt: null,
    publicFlags: 0,
    badges: [],
    guildNickname: null,
  }));
  const payload = {
    roles: ROLE_ORDER.map((name) => ({
      name,
      people: profiles.filter((person) => person.roles.includes(name)),
    })),
    updatedAt: new Date().toISOString(),
    count: profiles.length,
    mode: "manual",
  };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
