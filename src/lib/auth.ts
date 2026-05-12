import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { GraphQLClient, gql } from 'graphql-request';
import bcrypt from 'bcryptjs';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const verifyProjectUserPassword = async (
  inputPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    if (hashedPassword.startsWith('$2b$')) {
      return bcrypt.compareSync(inputPassword, hashedPassword);
    }

    if (hashedPassword.includes(':')) {
      const [saltHex, hash] = hashedPassword.split(':');
      if (!saltHex || !hash) return false;

      const passwordWithSalt = inputPassword + saltHex;
      let computedHash = passwordWithSalt;

      for (let i = 0; i < 10000; i++) {
        const encoder = new TextEncoder();
        const data = encoder.encode(computedHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      return computedHash === hash;
    }

    return inputPassword === hashedPassword;
  } catch (error) {
    return false;
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email, Username, or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;
        const { identifier, password } = credentials;

        const isEmail = identifier.includes('@');
        const isPhone = /^\+?[\d\s\-\(\)]+$/.test(identifier.replace(/\s/g, ''));

        // 1. Try Users table
        try {
          let userQuery;
          let variables;

          if (isEmail) {
            userQuery = gql`
              query GetUserByEmail($email: String!) {
                Users(where: { email: { _eq: $email }, is_active: { _eq: true } }) {
                  id name email password_hash phone gender role is_guest
                }
              }
            `;
            variables = { email: identifier };
          } else if (isPhone) {
            const cleanPhone = identifier.replace(/\D/g, '');
            userQuery = gql`
              query GetUserByPhone($phone: String!) {
                Users(where: { phone: { _eq: $phone }, is_active: { _eq: true } }) {
                  id name email password_hash phone gender role is_guest
                }
              }
            `;
            variables = { phone: cleanPhone };
          } else {
            userQuery = gql`
              query GetUserByUsername($name: String!) {
                Users(where: { name: { _eq: $name }, is_active: { _eq: true } }) {
                  id name email password_hash phone gender role is_guest
                }
              }
            `;
            variables = { name: identifier };
          }

          const res = await hasuraClient.request<{ Users: any[] }>(userQuery, variables);
          const user = res.Users[0];

          if (user && await bcrypt.compare(password, user.password_hash)) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              role: user.role,
              is_guest: user.is_guest || false,
              type: 'user'
            };
          }
        } catch (e) { console.error('Users auth error:', e); }

        // 2. Try ProjectUsers table
        try {
          const projectQuery = gql`
            query GetProjectUser($identity: String!) {
              ProjectUsers(where: { _or: [{ username: { _eq: $identity } }, { email: { _eq: $identity } }], is_active: { _eq: true } }) {
                id username email password role gender profile
              }
            }
          `;
          const pRes = await hasuraClient.request<{ ProjectUsers: any[] }>(projectQuery, { identity: identifier });
          const pUser = pRes.ProjectUsers[0];

          if (pUser && await verifyProjectUserPassword(password, pUser.password)) {
            return {
              id: pUser.id,
              name: pUser.username,
              email: pUser.email,
              role: pUser.role,
              gender: pUser.gender,
              image: pUser.profile,
              type: 'project_user'
            };
          }
        } catch (e) { console.error('ProjectUsers auth error:', e); }

        // 3. Try orgEmployees table
        try {
          const empQuery = gql`
            query GetEmployee($identity: String!) {
              orgEmployees(where: { _or: [{ email: { _eq: $identity } }, { phone: { _eq: $identity } }], active: { _eq: true } }) {
                id fullnames email phone password roleType gender
              }
            }
          `;
          const eRes = await hasuraClient.request<{ orgEmployees: any[] }>(empQuery, { identity: identifier });
          const eUser = eRes.orgEmployees[0];

          if (eUser && (eUser.password === password || await bcrypt.compare(password, eUser.password))) {
            return {
              id: eUser.id,
              name: eUser.fullnames,
              email: eUser.email,
              phone: eUser.phone,
              role: eUser.roleType,
              gender: eUser.gender,
              type: 'employee'
            };
          }
        } catch (e) { console.error('Employee auth error:', e); }

        throw new Error('Invalid credentials');
      },
    }),
  ],
  session: { strategy: 'jwt' },
  jwt: { secret: NEXTAUTH_SECRET },
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.gender = (user as any).gender;
        token.role = (user as any).role;
        token.type = (user as any).type;
        token.is_guest = (user as any).is_guest || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).phone = token.phone;
        (session.user as any).gender = token.gender;
        (session.user as any).role = token.role;
        (session.user as any).type = token.type;
        (session.user as any).is_guest = token.is_guest;
      }
      return session;
    },
  },
  pages: {
    signIn: '/Auth/Login',
  },
};
