import { privateConfig } from "@/config.private";

import { apply, serve } from "@photonjs/hono";
import { enhance } from "@universal-middleware/core";
import { Hono } from "hono";
import { appRouter } from "./server/_app";

const app = new Hono();

// Health checks
app.get("/up", async (c) => {
  return c.newResponse("🟢 UP", { status: 200 });
});

// For the Backend APIs
app.route("/api/*", appRouter);

 Vike
apply(app)

// Returning errors.
app.onError((error, c) => {
  console.error({
    cause: error.cause,
    message: error.message,
    stack: error.stack,
  });

  return c.json(
    {
      error: {
        cause: error.cause,
        message: c.error?.message ?? "Something went wrong.",
        stack: privateConfig.NODE_ENV === "production" ? undefined : error.stack,
      },
    },
    error.cause ?? 500
  );
});

export default serve(app, { port: privateConfig.PORT });
