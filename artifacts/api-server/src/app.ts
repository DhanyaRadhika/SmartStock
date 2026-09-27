import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttpModule from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const pinoHttp = pinoHttpModule as unknown as (
  options?: Record<string, unknown>,
) => express.RequestHandler;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigin = process.env.CLIENT_ORIGIN?.trim();

app.use(
  cors({
    credentials: true,
    origin: allowedOrigin || false,
  }),
);

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
    if (error instanceof SyntaxError) {
      return res
        .status(400)
        .json({ error: "Request body is not valid JSON." });
    }

    return res
      .status(500)
      .json({ error: "Something went wrong on the server." });
  },
);

export default app;
