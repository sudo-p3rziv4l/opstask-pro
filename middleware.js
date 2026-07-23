import { NextResponse } from 'next/server';

export async function middleware(request) {
  // BYPASS SEMUA AUTENTIKASI DI MIDDLEWARE SEMENTARA
  // Agar /board bisa diakses tanpa cookie!
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
