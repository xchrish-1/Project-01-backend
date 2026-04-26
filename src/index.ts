import app from "./app";

const port = process.env.PORT || 7000;

app.listen(port, () => {
  console.log(`server started on localhost:${port}`);
});
app.get("/", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});