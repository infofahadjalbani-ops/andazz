# ANDAZZ — Vercel deployment

This is a complete Next.js source project, not the previous Cloudflare archive.
Includes storefront, optimized images, collections, product pages, bag, centered checkout, COD/manual Meezan transfer, order APIs, and password-protected admin.
Music is removed. Design and catalogue are preserved from the existing site.

## Deploy using your browser

1. Extract the ZIP. Open the ANDAZZ-Vercel folder; package.json must be inside it.
2. Visit https://vercel.com/drop and upload the extracted project folder (not the old deployment archive).
3. Framework: Next.js. Build command: npm run build. Leave Output Directory at the framework default.
4. Create a dedicated Upstash Redis database at https://console.upstash.com . Disable eviction and keep the database active. Copy its REST URL and REST TOKEN (not the read-only token).
5. Vercel project → Settings → Environment Variables: add the five names below for Production. Add them separately; never upload real keys to GitHub.
6. Redeploy after adding variables. Before accepting customers, place one test order, check it in admin, and confirm its status can be changed.

Alternative: upload this folder's contents to a private GitHub repository, then import that repository into Vercel. The repository root must contain package.json.

## Required variables

| Name | Value |
| --- | --- |
| UPSTASH_REDIS_REST_URL | Your database REST URL |
| UPSTASH_REDIS_REST_TOKEN | Your database REST token |
| ADMIN_EMAIL | info.fahadjalbani@gmail.com |
| ADMIN_PASSWORD | Your unique password, at least 12 characters |
| SESSION_SECRET | Random secret, at least 32 characters |

Generate a secret locally with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
The .env.example contains names only, no working passwords or credentials.

## Admin and orders

Open https://YOUR-VERCEL-DOMAIN/admin/login and use ADMIN_EMAIL + ADMIN_PASSWORD above. This login does not use ChatGPT.
The configured account is the protected OWNER. From Orders, select MANAGE ADMINS to add admins by email and a password of at least 12 characters, or delete them after confirmation.
Admin links are intentionally absent from the public storefront. Bookmark /admin/login to access your portal; order APIs still require authenticated admin access.
Additional admins use the same /admin/login URL and can view/update orders. Only the owner can list, add or delete admins. Share initial passwords privately; no invitation email is sent.
Admins are stored in the same Upstash database with salted password hashes. Deleting an admin revokes their session on their next request, without deleting any orders. Re-adding the same email creates a fresh identity and does not reactivate old sessions.
Keep the same Upstash environment variables when redeploying to retain admins and orders. Existing sessions from the previous ZIP must sign in again once after this update.
Order records use Upstash keys beginning andazz:. They have no automatic expiry; retention depends on keeping your database/account active and within limits. Back up records through your database provider.
Old orders on the ChatGPT-hosted site are not migrated by this ZIP. This deployment starts with the records in your selected Upstash database.
Orders page shows the latest 250 orders. Refresh it to see newly received orders. There are no email/WhatsApp/push notifications in this version.

Bank transfer is MANUAL: customer transfers to Meezan Bank Limited / Fahad Hussain / 10250110527313, then enters a reference. The site does not debit cards or verify receipt from the bank. Verify funds yourself before confirming a transfer order.
Delivery/returns policy, actual stock availability and catalogue expansion still require owner input. The existing Everyday Essentials tab currently shows an unavailable message; no additional products have been invented.

## Local preview

Install Node.js 22+, run npm install --legacy-peer-deps, copy .env.example to .env.local, fill your own values, then run npm run dev.
Production check: npm run build then npm start.
Dependencies and generated build output are intentionally not zipped; Vercel installs/builds them.

## Validation

Next.js production build and TypeScript checks were run locally. No Vercel account deployment or real Upstash credentials are included. End-to-end order persistence must be tested after setting your own keys.
The responsive update fixes shrinking mobile product cards, narrow navigation, cart and checkout layout. Browser-based visual checks could not run in this environment because the browser download timed out. Check the deployed version on your phone before accepting customers.

References: https://vercel.com/docs/deployments and https://upstash.com/docs/redis/features/restapi
