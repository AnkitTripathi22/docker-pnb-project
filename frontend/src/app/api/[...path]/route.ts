import { NextRequest, NextResponse } from "next/server";

// Fallback to local Docker backend or Render backend
const getBackendBaseUrl = () => {
  let raw =
    process.env.BACKEND_URL ||
    process.env.BACKEND_INTERNAL_URL ||
    "http://backend:8000";

  // Local Docker Compose bridge support
  if (raw.includes("backend:8000")) {
    return "http://backend:8000";
  }

  // Ensure valid HTTPS protocol
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    if (!raw.includes(".")) {
      raw = `${raw}.onrender.com`;
    }
    raw = `https://${raw}`;
  }
  return raw.replace(/\/$/, "");
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const subPath = path.join("/");
    const baseUrl = getBackendBaseUrl();
    const targetUrl = `${baseUrl}/api/${subPath}`;

    const res = await fetch(targetUrl, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Server Proxy Error: ${err.message}` },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const subPath = path.join("/");
    const baseUrl = getBackendBaseUrl();
    const targetUrl = `${baseUrl}/api/${subPath}`;
    const body = await request.json();

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Server Proxy Error: ${err.message}` },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const subPath = path.join("/");
    const baseUrl = getBackendBaseUrl();
    const targetUrl = `${baseUrl}/api/${subPath}`;
    const body = await request.json();

    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Server Proxy Error: ${err.message}` },
      { status: 502 }
    );
  }
}

