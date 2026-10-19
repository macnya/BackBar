# Deploy BackBar with Supabase + Vercel

This project uses **Drizzle ORM + PostgreSQL**. The app talks to Supabase PostgreSQL from Next.js server code using a private `DATABASE_URL`; it does not need a Supabase browser/anon key or Supabase Auth.

## Before you start: free-tier suitability

- Supabase Free currently includes a 500 MB database and 5 GB egress, and a project may be paused after a week of inactivity. It does not include automatic database backups. Limits and terms can change; check [Supabase pricing](https://supabase.com/pricing). Keep your own exports and do not rely on the free database as the only copy of critical stock records.
- Vercel Hobby is for personal, non-commercial use. This application is intended for restaurant/bar operations; if using it commercially, check Vercel's current terms and use a plan/host that permits that use. See [Vercel pricing](https://vercel.com/pricing).
- A phone camera scanner requires HTTPS. Vercel's `*.vercel.app` URL and configured custom domains use HTTPS.

## 1. Create the Supabase project

1. Create an account at [supabase.com](https://supabase.com/) and create a new project.
2. Choose the region closest to the venue/users. Set and securely save a strong **database password**. This is not your Supabase login password.
3. Wait for the database to finish provisioning.
4. In the project, open **Connect** and copy the connection strings from the pooler section. Do not use a Supabase `anon`/publishable key or service-role key as a database password.

Use two connection strings:

- **App runtime:** choose **Transaction pooler**, normally port `6543`. This is suitable for Vercel's serverless functions.
- **Schema changes:** choose **Session pooler**, normally port `5432`. Use this for the one-off Drizzle schema push and future migrations. Supabase's direct database host can be IPv6-only on Free; the session pooler works over IPv4.

The copied pooler username commonly looks like `postgres.<project-ref>`. Use the exact username, host, and database name shown by Supabase. If the password contains URI-special characters (such as `@`, `:`, `/`, `#`, or `%`), URL-encode the password or use the connection string Supabase generates. Require TLS by using `sslmode=require` in the URL (add it after `?`, or use `&` if the URL already has query parameters).

## 2. Create the app's database tables

The project includes the Drizzle schema, including default-deny Row Level Security (RLS) on its tables. The app's server connection uses the private project database role; public Supabase Data API roles receive no policies and cannot query these tables directly.

For local setup, copy `.env.example` to `.env.local` and set:

```dotenv
DATABASE_URL="<Supabase Transaction pooler URL, port 6543, with sslmode=require>"
DRIZZLE_DATABASE_URL="<Supabase Session pooler URL, port 5432, with sslmode=require>"
AUTH_SECRET="<unique random value with at least 32 characters>"
```

Generate a secret, for example:

```bash
openssl rand -base64 32
```

If OpenSSL is unavailable, use Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Then from the project root, apply the schema to the **new, empty Supabase database**:

```bash
npx drizzle-kit push
```

Review the proposed changes and confirm. This creates the app's seven tables and their indexes/RLS settings. Do not run a schema push against a database containing data you cannot risk changing. For later production schema changes, generate and review Drizzle migrations instead of automatically changing the live schema during a Vercel build.

You can verify the tables in Supabase **Table Editor**. The app uses the server-side PostgreSQL connection, so do not add permissive public policies just to make the app work.

## 3. Put the source in GitHub

Make sure real `.env`, `.env.local`, and other secret files are not committed. This project now ignores them; `.env.example` is safe to commit because it contains placeholders only.

If the project is not already in a Git repository, create an empty GitHub repository, then run from the project root (replace the URL):

```bash
git init
git add .
git commit -m "Prepare BackBar for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

If this project already has a remote, commit and push the changes to its production branch instead.

## 4. Import the project into Vercel

1. Sign in at [vercel.com](https://vercel.com/), choose **Add New → Project**, and import the GitHub repository.
2. Vercel should detect **Next.js** automatically. Keep the project root as the Root Directory. The build command should be `npm run build` (Vercel's Next.js default is also fine); do not configure an Edge runtime for the database routes.
3. Before deploying, open **Environment Variables** and add these server-only variables:
   - `DATABASE_URL` = Supabase **Transaction pooler** string, port `6543`, with SSL required.
   - `AUTH_SECRET` = the random secret from step 2. Use a different secret for Production and Preview if you enable previews.
4. Apply the variables to **Production**. For Preview, use a separate Supabase project/database if available. If you point Preview at the production database, preview tests will change live stock data.
5. Click **Deploy**. If you add or change variables after the first deployment, trigger a new deployment; old deployments do not acquire new environment values.

Do not add `DATABASE_URL` or `AUTH_SECRET` with a `NEXT_PUBLIC_` prefix. Never put them in client-side code or commit them to GitHub. This app does not need `NEXT_PUBLIC_SUPABASE_URL`, a Supabase publishable key, or a service-role key.

## 5. Test the live deployment

1. Open the Vercel deployment URL and check `/api/health` returns `{"ok":true}`. This checks the app process only, not its database connection.
2. Register a test venue, add a product, refresh the page, then check the corresponding rows in Supabase Table Editor. This confirms the Vercel-to-Supabase connection and persistent writes.
3. Test stock-in/stock-out, Excel template download/import, supplier editing, menu costing, and logout/login.
4. Open **Scan & Adjust** on a phone over HTTPS, grant camera permission, and test a printed barcode/QR label. Manual code entry remains available if camera permissions are denied.
5. If the database connection fails, check the Vercel function logs and confirm the runtime URL is the Supabase **Transaction pooler** string with the exact host, port `6543`, username, password, database name, and TLS setting.

The public **Explore the live demo venue** button creates/opens a shared sample venue in this same database. Use your own registered account for real venue data.

## 6. Add a custom domain (optional)

In Vercel, open the project **Settings → Domains**, add your domain, then apply the exact DNS records Vercel displays at your domain registrar. Wait for Vercel to verify the domain and provision HTTPS. The secure domain also allows phone camera scanning.

## 7. Protect your data

- Export/backup your stock and movement data regularly. Free Supabase does not provide automatic backups; keep the export somewhere separate from Supabase.
- Keep the database connection URL and `AUTH_SECRET` private. Rotating `AUTH_SECRET` signs all current sessions out; users will need to log in again.
- Use separate Supabase databases for preview and production where possible, and never use a preview deployment to test destructive operations on live stock.
- For future schema changes, review generated migration SQL and apply it deliberately to Supabase. Do not add `drizzle-kit push` to Vercel's build command.
