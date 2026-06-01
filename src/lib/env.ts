import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  REDIS_URL: z.string().url(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  STORAGE_TYPE: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("./uploads"),
  SCOPUS_API_KEY: z.string().optional(),
  SCHOLAR_PROXY_URL: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),
  CROSSREF_EMAIL: z.string().email().optional(),
  CORE_API_KEY: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("Faculty Publication Intelligence Agent"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

let parsedEnv;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    for (const issue of err.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    // We don't throw here to allow Next.js build to succeed if some vars are missing at build time
    // but in a real production environment we might want to fail fast.
  }
}

export const env = parsedEnv as z.infer<typeof envSchema>;
export const isDevelopment = env?.NODE_ENV === "development";
export const isProduction = env?.NODE_ENV === "production";
