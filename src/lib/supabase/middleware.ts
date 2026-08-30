import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ["/devices", "/rules", "/logs"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  const pathname = request.nextUrl.pathname;

  // Redirect logged-in users away from auth
  if (
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/devices";
    return NextResponse.redirect(url);
  }

  // 404 auto-redirect: unknown routes -> landing or /devices if authenticated
  // Known prefixes: /, /auth, /devices, /rules, /logs, /api, /icon.svg
  const knownPrefixes = ["/", "/auth", "/devices", "/rules", "/logs", "/api", "/icon.svg"];
  const isKnown =
    pathname === "/" ||
    knownPrefixes.some((p) => p !== "/" && pathname.startsWith(p));

  if (!isKnown) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/devices" : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
