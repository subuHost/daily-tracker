import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Auth routes - redirect to dashboard if already logged in
    if (session && req.nextUrl.pathname.startsWith("/auth")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protected routes - redirect to login if not authenticated
    const protectedRoutes = [
        "/dashboard",
        "/finance",
        "/shopping",
        "/tasks",
        "/journal",
        "/habits",
        "/calendar",
        "/contacts",
        "/gallery",
        "/reports",
        "/settings",
        "/notifications",
        "/chat",
        "/ai",
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
        req.nextUrl.pathname.startsWith(route)
    );

    if (!session && isProtectedRoute) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Root (/) is now allowed (Landing Page)
    // Protected routes logic above handles other paths

    return res;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
