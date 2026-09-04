import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// The storefront and API are served through the same origin in preview environments. If a
// separate frontend origin is explicitly configured, allow only that origin;
// reflecting arbitrary credentialed origins would expose session cookies.
const allowedOrigin = process.env.CLIENT_ORIGIN?.trim();
app.use(cors({ credentials: true, origin: allowedOrigin || false }));
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    service: "SmartStock API",
    status: "ok",
    apiBase: "/api",
    health: "/api/healthz",
  });
});

app.use("/api", router);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof SyntaxError)
      return res.status(400).json({ error: "Request body is not valid JSON." });
    return res
      .status(500)
      .json({ error: "Something went wrong on the server." });
  },
);

export default app;
