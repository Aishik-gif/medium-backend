import { createBlogInput, updateBlogInput } from "@aishikd2/medium-common";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    prisma: any;
  };
}>();

//auth middleware
blogRouter.use("*", async (c, next) => {
  const jwt = c.req.header("Authorization");
  if (!jwt) {
    c.status(403);
    return c.json({ error: "unauthorized" });
  }

  const token = jwt.split(" ")[1];

  try {
    const response = await verify(token, c.env.JWT_SECRET);

    if (!response) {
      c.status(403);
      return c.json({ error: "unauthorized" });
    }
    c.set("userId", response.id);
  } catch (e) {
    c.status(403);
    return c.json({ error: "unauthorized" });
  }
  await next();
});

//new blog post
blogRouter.post("/", async (c) => {
  try {
    const prisma = c.get("prisma");
    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({ error: "inputs not correct" });
    }
    const authorId = c.get("userId");
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: authorId,
      },
    });

    return c.json({
      id: post.id,
    });
  } catch (e) {
    console.log(e);
    c.status(411);
    return c.json({ error: e });
  }
});

//update blog
blogRouter.put("/", async (c) => {
  try {
    const prisma = c.get("prisma");
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({ error: "inputs not correct" });
    }
    const post = await prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    return c.json({
      id: body.id,
    });
  } catch (e) {
    c.status(411);
    return c.json({ error: "Invalid" });
  }
});

//get all blogs (pagination)
blogRouter.get("/bulk", async (c) => {
  try {
    const prisma = c.get("prisma");
    const posts = await prisma.post.findMany({
      select: {
        content: true,
        title: true,
        id: true,
        date: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      posts,
    });
  } catch (e) {
    c.status(411);
    return c.json({ error: "Invalid" });
  }
});

//get a blog with id
blogRouter.get("/:id", async (c) => {
  try {
    const prisma = c.get("prisma");
    const id = c.req.param("id");
    const post = await prisma.post.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      post,
    });
  } catch (e) {
    c.status(411);
    return c.json({ error: "Invalid" });
  }
});
