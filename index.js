import authenticate from "./services/authentication.js";
import { generateCode } from "./services/steamGuard.js";
import { getSecret } from "./services/secrets.js";

export const handler = async (event) => {
  if (event.requestContext.http.method !== "POST") {
    return { statusCode: 405, body: { error: "Method not allowed" } };
  }

  const authSuccess = await authenticate(event.headers?.authorization || "");
  if (!authSuccess) {
    return { statusCode: 401, body: { error: "Authentication failed" } };
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: { error: "Bad request" } };
  }

  const missingKey = ["account_id"].find((key) => !parsed[key]);
  if (missingKey) {
    return { statusCode: 400, body: { error: `Missing ${missingKey} param` } };
  }

  const { account_id } = parsed;

  const secret = getSecret(account_id);

  try {
    return {
      statusCode: 200,
      body: { code: generateCode(secret) },
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: err?.request?.data,
    };
  }
};
