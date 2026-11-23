import { neonAuth } from "@/lib/neon-auth/server";

export const { GET, POST, PUT, PATCH, DELETE } = neonAuth.handler();
