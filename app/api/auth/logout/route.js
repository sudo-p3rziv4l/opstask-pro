import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: true, warning: "Force logout" });
  }
}
