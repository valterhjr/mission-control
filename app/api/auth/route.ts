import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "mc_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code } = body;

        const correctCode = process.env.MISSION_CONTROL_KEY;

        // If no key is set in env, we might want to block access or allow a default dev key.
        // For security, if not set, we should probably fail or warn.
        // Here we'll assume if not set, auth is disabled OR we require it to be set.
        // Let's enforce it must be set.
        if (!correctCode) {
            console.error("MISSION_CONTROL_KEY not set in environment variables");
            return NextResponse.json(
                { error: "Server misconfiguration" },
                { status: 500 }
            );
        }

        if (code !== correctCode) {
            return NextResponse.json({ error: "Access Denied" }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, "active", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: MAX_AGE,
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
}
