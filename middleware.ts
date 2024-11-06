import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth({
  callbacks: {
    authorized: ({ token }: any) => {
      if (token && token.role === "ADMIN") {
        return true; // Grant access if the role is ADMIN
      }
      return false; // Deny access otherwise
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/signup", // Redirect unauthorized users to the signup page
  },
});

// Apply the middleware to the /admin routes only
export const config = { matcher: ["/admin/:path*"] };
