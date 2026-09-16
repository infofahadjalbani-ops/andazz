// Isolated authorization tests; never connects to a real database.
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const records = new Map();
let token;
const env = {ADMIN_EMAIL:"owner@example.com",ADMIN_PASSWORD:"owner-password-test",SESSION_SECRET:"test-secret-".repeat(4)};
const redis = {redisCommand: async ([cmd,key,email,value]) => {
 if(cmd==="HGET") return records.get(email) || null;
 if(cmd==="HVALS") return [...records.values()];
 if(cmd==="HSETNX") {if(records.has(email))return 0;records.set(email,value);return 1;}
 if(cmd==="HDEL") return +records.delete(email);
 throw new Error("Unexpected command");
}};
function load(path, mocks) {
 const exports = {};
 const source = ts.transpileModule(fs.readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,Buffer,URL,process:{env},require:name => mocks[name] || require(name)});
 return exports;
}
const auth = load("lib/admin-auth.ts",{"next/headers":{cookies:async()=>({get:()=>({value:token})})},"./redis":redis});
const api = load("app/api/admin/admins/route.ts",{"@/lib/admin-auth":auth,"@/lib/redis":redis,"next/server":{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}}});
const request = (body, origin="https://store.example") => new Request("https://store.example/api/admin/admins",{method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify(body)});
(async()=>{
 assert.equal((await api.GET()).status,403);
 token = await auth.createAdminToken(await auth.authenticate(env.ADMIN_EMAIL,env.ADMIN_PASSWORD));
 assert.equal((await api.POST(request({email:env.ADMIN_EMAIL,password:"some-password-123"}))).status,400);
 assert.equal((await api.DELETE(request({email:env.ADMIN_EMAIL}))).status,400);
 assert.equal((await api.POST(request({email:"a@example.com",password:"short"}))).status,400);
 assert.equal((await api.POST(request({email:"a@example.com",password:"password-12345"},"https://attacker.example"))).status,403);
 assert.equal((await api.POST(request({email:" A@EXAMPLE.COM ",password:"password-12345"}))).status,201);
 assert.equal((await api.POST(request({email:"a@example.com",password:"password-12345"}))).status,409);
 const listed = await api.GET();
 assert.equal(listed.body.admins.length,1);
 assert.equal(JSON.stringify(listed.body).includes("passwordHash"),false);
 assert.equal([...records.values()][0].includes("password-12345"),false);
 assert.equal(await auth.authenticate("a@example.com","wrong"),null);
 const ownerToken=token;
 const adminToken = await auth.createAdminToken(await auth.authenticate("a@example.com","password-12345"));
 token=adminToken;
 assert.equal(await auth.isAdmin(),true);
 assert.equal((await api.GET()).status,403);
 assert.equal((await api.POST(request({email:"b@example.com",password:"password-12345"}))).status,403);
 assert.equal((await api.DELETE(request({email:"a@example.com"}))).status,403);
 assert.equal(await auth.verifyAdminToken(adminToken+"tampered"),null);
 token=ownerToken;
 assert.equal((await api.DELETE(request({email:"a@example.com"}))).status,200);
 assert.equal(await auth.verifyAdminToken(adminToken),null);
 assert.equal(await auth.authenticate("a@example.com","password-12345"),null);
 assert.equal((await api.POST(request({email:"a@example.com",password:"new-password-12345"}))).status,201);
 assert.equal(await auth.verifyAdminToken(adminToken),null);
 assert.equal(await auth.isAdmin(),true);
 console.log("PASS: owner protection, permissions, input validation, password hashing, duplicate prevention, login, deletion and session revocation.");
})().catch(error=>{console.error(error);process.exitCode=1;});
