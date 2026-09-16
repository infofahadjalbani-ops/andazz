const {chromium}=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try {
 const page=await browser.newPage();
 await page.route("**/*",async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=="andazz.test")return route.abort();
  if(u.pathname==="/"||u.pathname==="/index.html"){
   let html=fs.readFileSync("legacy/index.html","utf8");
   html=html.replace("</head>",'<link rel="stylesheet" href="/store.css"><link rel="stylesheet" href="/mobile.css"></head>');
   return route.fulfill({contentType:"text/html",body:html});
  }
  const file=path.join(process.cwd(),"public",u.pathname);
  if(!fs.existsSync(file))return route.fulfill({status:404,body:""});
  const ext=path.extname(file);
  return route.fulfill({body:fs.readFileSync(file),contentType:({".js":"application/javascript",".css":"text/css",".webp":"image/webp",".svg":"image/svg+xml"})[ext]||"application/octet-stream"});
 });
 for(const width of [320,375,390,430,768,1280]){
  await page.setViewportSize({width,height:844});
  await page.goto("http://andazz.test/");
  await page.waitForSelector("#bagButton");
  assert.equal(await page.locator('a[href^="/admin"]').count(),0);
  if(width<=700){
   const card=await page.locator(".seller-card").first().boundingBox();
   assert(card.width>width*.7,"Product cards must not shrink");
  }
  await page.goto("http://andazz.test/?page=collection&type=sweatshirts");
  await page.waitForSelector(".store-grid");
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Collection overflow");
  await page.goto("http://andazz.test/?page=product&id=ash-noise-sweat");
  await page.waitForSelector("#addProduct");
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Product overflow");
  await page.locator("#addProduct").click();
  assert.equal(await page.locator("#cartDrawer.open").count(),0);
  await page.locator("#bagButton").click();
  await page.locator("#checkoutButton").click();
  const box=await page.locator("#storeDialog").boundingBox();
  assert(box.x>=0 && box.x+box.width<=width+1 && box.y>=0,"Checkout must fit viewport");
  assert(await page.locator("#storeDialog").evaluate(el=>el.scrollWidth<=el.clientWidth+1),"Checkout content overflow");
  console.log("PASS width",width);
 }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
