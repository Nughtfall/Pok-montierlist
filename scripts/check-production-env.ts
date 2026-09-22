const production = process.argv.includes("--production");
const errors: string[] = [];

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} is required.`);
  return value;
}

function parseUrl(name: string, value: string | undefined) {
  if (!value) return null;
  try { return new URL(value); }
  catch { errors.push(`${name} must be a valid URL.`); return null; }
}

const database = parseUrl("DATABASE_URL", required("DATABASE_URL"));
if (database && !["postgres:", "postgresql:"].includes(database.protocol)) errors.push("DATABASE_URL must use PostgreSQL.");

const authSecret = required("AUTH_SECRET");
if (authSecret && (authSecret.length < 32 || authSecret.includes("replace-with"))) errors.push("AUTH_SECRET must be a non-placeholder secret with at least 32 characters.");

const authUrl = parseUrl("AUTH_URL", required("AUTH_URL"));
if (production && authUrl?.protocol !== "https:") errors.push("AUTH_URL must use HTTPS for production validation.");

for (const provider of ["GOOGLE", "DISCORD"] as const) {
  const id = process.env[`AUTH_${provider}_ID`]?.trim();
  const secret = process.env[`AUTH_${provider}_SECRET`]?.trim();
  if (Boolean(id) !== Boolean(secret)) errors.push(`AUTH_${provider}_ID and AUTH_${provider}_SECRET must be configured together.`);
}

if (errors.length) {
  console.error(`Environment validation failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Environment validation passed for ${production ? "production" : "local/runtime"} configuration.`);
}
