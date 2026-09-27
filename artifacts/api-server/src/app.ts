import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";

const app: Express = express();

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
