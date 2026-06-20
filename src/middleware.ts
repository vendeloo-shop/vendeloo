import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const protectedArea = path.startsWith('/app') && path !== '/app/login' && path !== '/app/reset';
  const ownerArea = path.startsWith('/panel');

  if ((protectedArea || ownerArea) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/app/login';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ['/app/:path*', '/panel/:path*'],
};
