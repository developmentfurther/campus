// app/api/spotify/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // evita caches raros con token

import { NextResponse } from "next/server";

const SHOW_ID = "1S9j1XZF0DscjTgITQOqH6";

export async function GET() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Faltan credenciales de Spotify" },
      { status: 500 }
    );
  }

  try {
    // 1) Token (Client Credentials Flow)
    const authString = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const authResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
    });

    const authText = await authResponse.text();
    if (!authResponse.ok) {
      // Spotify suele devolver JSON con error_description
      return NextResponse.json(
        {
          error: "Error autenticando con Spotify",
          status: authResponse.status,
          details: safeJson(authText),
        },
        { status: 500 }
      );
    }

    const authData = JSON.parse(authText);
    const token = authData.access_token as string;

    // 2) Episodios del show
    // market es opcional pero recomendado (y a veces evita vacíos). :contentReference[oaicite:1]{index=1}
    const showResponse = await fetch(
      `https://api.spotify.com/v1/shows/${SHOW_ID}/episodes?limit=10&market=AR`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store", // en route handlers yo prefiero esto y cachear vos si querés
      }
    );

    const showText = await showResponse.text();
    if (!showResponse.ok) {
      return NextResponse.json(
        {
          error: "Error obteniendo episodios",
          status: showResponse.status,
          details: safeJson(showText),
        },
        { status: 500 }
      );
    }

    const showData = JSON.parse(showText);
    return NextResponse.json(showData.items || []);
  } catch (err: any) {
    console.error("Spotify API Error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor", message: err?.message },
      { status: 500 }
    );
  }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
