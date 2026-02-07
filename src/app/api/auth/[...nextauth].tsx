import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { GraphQLClient, gql } from "graphql-request";
import bcrypt from "bcryptjs";

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { "x-hasura-admin-secret": HASURA_SECRET },
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email, Username, or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;
        const { identifier, password } = credentials;

        // Determine if identifier is email, phone, or username
        const isEmail = identifier.includes("@");
        const isPhone = /^\+?[\d\s\-\(\)]+$/.test(
          identifier.replace(/\s/g, "")
        );

        let query;
        let variables;

        if (isEmail) {
          query = gql`
            query GetUserByEmail($email: String!) {
              Users(
                where: { email: { _eq: $email }, is_active: { _eq: true } }
              ) {
                id
                name
                email
                password_hash
                phone
                gender
                role
                created_at
                is_active
                profile_picture
                updated_at
                is_guest
              }
            }
          `;
          variables = { email: identifier };
        } else if (isPhone) {
          // Clean phone number for comparison
          const cleanPhone = identifier.replace(/\D/g, "");
          query = gql`
            query GetUserByPhone($phone: String!) {
              Users(
                where: { phone: { _eq: $phone }, is_active: { _eq: true } }
              ) {
                id
                name
                email
                password_hash
                phone
                gender
                role
                created_at
                is_active
                profile_picture
                updated_at
                is_guest
              }
            }
          `;
          variables = { phone: cleanPhone };
        } else {
          // Assume it's a username
          query = gql`
            query GetUserByUsername($name: String!) {
              Users(where: { name: { _eq: $name }, is_active: { _eq: true } }) {
                id
                name
                email
                password_hash
                phone
                gender
                role
                created_at
                is_active
                profile_picture
                updated_at
                is_guest
              }
            }
          `;
          variables = { name: identifier };
        }

        const res = await hasuraClient.request<{
          Users: Array<{
            id: string;
            name: string;
            email: string;
            password_hash: string;
            phone: string;
            gender: string;
            role: string;
            is_guest?: boolean;
          }>;
        }>(query, variables);
        const user = res.Users[0];
        if (!user) {
          throw new Error("No user found");
        }
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          is_guest: user.is_guest || false,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: { secret: NEXTAUTH_SECRET },
  secret: NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_SECURE_COOKIES === "true",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_SECURE_COOKIES === "true",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NEXTAUTH_SECURE_COOKIES === "true",
      },
    },
  },
  useSecureCookies: process.env.NEXTAUTH_SECURE_COOKIES === "true",
  pages: {
    signIn: "/Auth/Login",
    signOut: "/",
  },
  events: {
    async signOut() {
      // This event is called when the user signs out
      // We can use this to clear any server-side session data if needed
      console.log("User signed out");
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.gender = (user as any).gender;
        token.role = (user as any).role;
        token.is_guest = (user as any).is_guest || false;
      } else if (token.id) {
        // If no user but we have a token ID, fetch the latest user data
        // This ensures we always have the latest role and guest status
        try {
          const query = gql`
            query GetUserById($id: uuid!) {
              Users_by_pk(id: $id) {
                id
                role
                is_guest
              }
            }
          `;

          const res = await hasuraClient.request<{
            Users_by_pk: { id: string; role: string; is_guest?: boolean };
          }>(query, { id: token.id });

          if (res.Users_by_pk) {
            // Update the role and guest status in the token
            token.role = res.Users_by_pk.role;
            token.is_guest = res.Users_by_pk.is_guest || false;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // If Hasura is unavailable, set default values to allow authentication to continue
          token.role = token.role || "user"; // Default to user role
          token.is_guest = token.is_guest || false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // If token is null or invalid, return null session
      if (!token || !token.id) {
        return null as any;
      }

      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).phone = (token as any).phone;
        (session.user as any).gender = (token as any).gender;
        (session.user as any).role = (token as any).role;
        (session.user as any).is_guest = (token as any).is_guest || false;
      }
      return session;
    },
  },
};

// NextAuth using the above options
export default NextAuth(authOptions);
