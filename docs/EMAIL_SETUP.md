# Order Email Notifications — Gmail SMTP Setup Guide (Frag Avenue)

Every time a customer successfully places an order (status `pending`), an email
"**New Order Received - FA-XXXXXXXX**" is sent to `fragavenuebd@gmail.com`.

---

## 1. Enable Google 2-Step Verification

1. Sign in to the Gmail account `fragavenuebd@gmail.com`.
2. Go to <https://myaccount.google.com/security>.
3. Under **How you sign in to Google**, click **2-Step Verification** → **Get started**.
4. Confirm your password, add your phone number, enter the SMS/prompt code, and turn it **ON**.

App Passwords are only available after 2-Step Verification is enabled.

## 2. Generate a Gmail App Password

1. Go to <https://myaccount.google.com/apppasswords>.
2. App name: `Frag Avenue Website` → **Create**.
3. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`).
4. Store it as `SMTP_PASS`. Never use your normal Gmail password, and never commit it.

## 3. Environment variables

| Variable           | Value                              | Required |
| ------------------ | ---------------------------------- | -------- |
| `SMTP_HOST`        | `smtp.gmail.com`                   | yes      |
| `SMTP_PORT`        | `465`                              | yes      |
| `SMTP_SECURE`      | `true`                             | yes      |
| `SMTP_USER`        | `fragavenuebd@gmail.com`           | yes      |
| `SMTP_PASS`        | 16-char Gmail App Password         | yes      |
| `ORDER_NOTIFY_TO`  | `fragavenuebd@gmail.com`           | optional (defaults to `SMTP_USER`) |
| `SMTP_FROM`        | `Frag Avenue <fragavenuebd@gmail.com>` | optional |

For local development, put them in a local `.env` file that is **not** committed.

## 4. Test locally

```bash
npm install          # or bun install
npm run dev
```

1. Sign in on the site, add a product to the cart, complete checkout.
2. Watch the server terminal: `[order-email] notification sent for FA-XXXXXXXX`.
3. Check the `fragavenuebd@gmail.com` inbox (and Spam on first send).

Quick connection-only check:

```bash
node -e "require('nodemailer').createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}).verify().then(()=>console.log('SMTP OK')).catch(console.error)"
```

## 5. Deploy on Vercel

1. Vercel → Project → **Settings → Environment Variables**.
2. Add every variable from section 3 for **Production**, **Preview** and **Development**.
3. Redeploy (env changes only apply to new deployments).
4. Place a test order on the live site and confirm the email arrives.

Note: SMTP requires a Node.js runtime. Keep the deployment on the default
Node serverless runtime — do not force the Edge runtime for this project.

## 6. Common errors and fixes

| Error | Cause | Fix |
| ----- | ----- | --- |
| `Invalid login: 535-5.7.8 Username and Password not accepted` | Normal password used, or App Password revoked | Regenerate the App Password, paste without quotes |
| `Missing credentials for "PLAIN"` | `SMTP_USER`/`SMTP_PASS` not loaded | Verify env vars exist in that environment and redeploy |
| `Connection timeout` / `ETIMEDOUT` | Port 465 blocked by host | Try `SMTP_PORT=587` with `SMTP_SECURE=false` (STARTTLS) |
| `self signed certificate in certificate chain` | Corporate proxy | Use a network without TLS interception |
| Email in Spam | New sender reputation | Mark "Not spam"; add the sender to contacts |
| `smtp credentials not configured` warning in logs | Env vars missing | Add them; orders still succeed without email |
| Gmail daily limit (~500/day) | High volume | Move to a transactional provider (Resend/Brevo) |

## 7. Security best practices

- App Password only — never the account password.
- Credentials live in environment variables/secret storage, never in code or Git.
- Nothing SMTP-related is exposed to the browser; sending happens on the server only.
- Errors are logged with messages only — passwords are never logged.
- Email failures never break checkout: order creation always succeeds.
- The notification server function is authenticated and only sends for orders owned by the signed-in caller.
- Rotate the App Password if it may have leaked (revoke it in the Google Account App Passwords page).
