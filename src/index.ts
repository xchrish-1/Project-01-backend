import app from "./app";

const port = process.env.PORT || 7000;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`server started on localhost:${port}`);
  });
}

export default app; // ← Vercel uses this