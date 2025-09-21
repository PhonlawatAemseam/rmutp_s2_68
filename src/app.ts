import 'dotenv/config';
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Md5 } from "md5-typescript";
import { encryptJSON, decryptJSON } from "./security";

const prisma = new PrismaClient();
const app = new Hono();

// --- TEST ---
app.get("/", (c) => c.text("Hello World Today!"));

// --- GET all profiles ---
app.get("/profile", async (c) => {
  const profiles = await prisma.profile.findMany();
  profiles.forEach((data) => {
    delete data.password;
  });

  return c.json(
    {
      message: "get data completed",
      data: profiles,
    },
    200
  );
});

// --- POST profile ---
app.post("/profile", async (c) => {
  const body = await c.req.json();

  // hash password
  const passwordHash = await bcrypt.hash(body.password, 13);
  body.password = passwordHash;

  // md5 mobile + cardId
  body.mobile = Md5.init(body.mobile);
  body.cardId = Md5.init(body.cardId);

  body.status = false;

  const result = await prisma.profile
    .create({ data: body })
    .then((data) => {
      delete data.password;
      return data;
    })
    .catch((err) => {
      console.error("create profile failed", err?.message);
      return "please recheck username, mobile or cardId";
    });

  return c.json({
    message: "create profile completed",
    data: result,
  });
});

// --- GET profile/:id ---
app.get("/profile/:id", async (c) => {
  const id = c.req.param("id");
  const profile = await prisma.profile.findFirstOrThrow({
    where: { id },
  });
  delete profile.password;

  return c.json(
    {
      message: "get data completed",
      data: profile,
    },
    200
  );
});

// --- POST login ---
app.post("/login", async (c) => {
  const body = await c.req.json();
  const user = await prisma.profile.findUnique({
    select: { password: true },
    where: { username: body.username },
  });

  const isMatch = await bcrypt.compare(body.password, user?.password ?? "");
  return c.json({
    message: "login completed",
    data: isMatch,
  });
});

// --- (1) POST /encode (เหมือน POST /profile แต่บันทึกเข้ารหัส) ---
app.post("/encode", async (c) => {
  const body = await c.req.json();

  try {
    const encrypted = encryptJSON(body);
    const saved = await prisma.encryptedProfile.create({
      data: { payload: encrypted },
    });

    return c.json({ message: "encode completed", id: saved.id }, 201);
  } catch (err: any) {
    console.error("Encode error:", err);
    return c.json({ error: "encode failed", detail: err.message }, 500);
  }
});

// --- (2) GET /decode/:id (เหมือน GET /profile/:id แต่ถอดรหัส) ---
app.get("/decode/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const rec = await prisma.encryptedProfile.findUnique({ where: { id } });

  if (!rec) return c.json({ error: "Not found" }, 404);

  try {
    const obj = decryptJSON(rec.payload);
    return c.json({ message: "decode completed", data: obj }, 200);
  } catch (err: any) {
    console.error("Decode error:", err);
    return c.json({ error: "decode failed", detail: err.message }, 500);
  }
});

export default app;
