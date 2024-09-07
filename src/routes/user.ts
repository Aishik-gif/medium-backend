import { Hono } from "hono";
import { sign } from "hono/jwt";
import { signupInput, signinInput } from "@aishikd2/medium-common";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    prisma: any;
  };
}>();

userRouter.post("/signup", async (c) => {
  try {
    const prisma = c.get("prisma");

    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({ error: "inputs not correct" });
    }
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name || "",
      },
    });
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({
      jwt: token,
    });
  } catch (error) {
    c.status(411);
    return c.json({ error: "Invalid" });
  }
});

userRouter.post("/signin", async (c) => {
  try {
    const prisma = c.get("prisma");

    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({ error: "inputs not correct" });
    }
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password,
      },
    });

    if (!user) {
      c.status(403);
      return c.json({ error: "user not found" });
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({
      jwt: token,
    });
  } catch (e) {
    c.status(411);
    return c.json({ error: "Invalid" });
  }
});
