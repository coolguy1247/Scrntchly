// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "ProxyBrowser/1.0",
      },
    });

    const contentType = response.headers.get("content-type") || "text/html";
    const body = await response.text();

    res.setHeader("content-type", contentType);
    res.send(body);
  } catch (err) {
    res.status(500).send("Error fetching target: " + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Proxy listening on http://localhost:" + port);
});
