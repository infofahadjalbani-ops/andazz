import Script from "next/script";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

function legacyMarkup() {
  const source = fs.readFileSync(path.join(process.cwd(), "legacy/index.html"), "utf8");
  const style = source.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const body = source.match(/<body>([\s\S]*?)<script src="app\.js[^>]*><\/script>\s*<\/body>/)?.[1] ?? "";
  return { style, body };
}

export default function Home() {
  const { style, body } = legacyMarkup();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <link rel="stylesheet" href="/store.css?v=8" />
      <link rel="stylesheet" href="/mobile.css?v=1" />
      <div id="storeRoot" dangerouslySetInnerHTML={{ __html: body }} />
      <Script src="/app.js?v=7" strategy="afterInteractive" />
    </>
  );
}
