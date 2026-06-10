import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve front-end
app.use(express.static(path.join(__dirname, "public")));

// Helper: build proxied URL for assets
function buildProxyUrl(targetUrl, assetUrl) {
  const base = new URL(targetUrl);
  const resolved = new URL(assetUrl, base);
  return "/proxy?url=" + encodeURIComponent(resolved.toString());
}

// Main proxy route
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "ProxyBrowser/1.0",
        Accept: "*/*",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");

    if (!isHtml) {
      // Non-HTML: just stream through
      res.setHeader("content-type", contentType || "application/octet-stream");
      const buffer = await response.buffer();
      return res.send(buffer);
    }

    const html = await response.text();

    // Parse and rewrite links
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Rewrite <a>, <link>, <script>, <img>, etc.
    const rewriteAttr = (selector, attr) => {
      document.querySelectorAll(selector).forEach((el) => {
        const val = el.getAttribute(attr);
        if (!val) return;
        // Ignore data: and javascript:
        if (/^(data:|javascript:)/i.test(val)) return;

        const proxied = buildProxyUrl(target, val);
        el.setAttribute(attr, proxied);
      });
    };

    rewriteAttr("a[href]", "href");
    rewriteAttr("link[href]", "href");
    rewriteAttr("script[src]", "src");
    rewriteAttr("img[src]", "src");
    rewriteAttr("iframe[src]", "src");

    // Optional: rewrite form actions so submissions go through proxy
    document.querySelectorAll("form[action]").forEach((form) => {
      const action = form.getAttribute("action");
      if (!action) return;
      const proxied = buildProxyUrl(target, action);
      form.setAttribute("action", proxied);
    });

    const proxiedHtml = dom.serialize();

    res.setHeader("content-type", "text/html; charset=utf-8");
    res.send(proxiedHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching target: " + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Proxy listening on http://localhost:" + port);
});
