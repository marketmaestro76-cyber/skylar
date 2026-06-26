# Skylar Capital

Professional hedge fund portfolio website built with React, Vite, and Tailwind CSS.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your Google Sheet ID:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Google Sheets structure

The app expects two public tabs in a published Google Sheet:

### `Dashboard`

Use either direct metric column names or a `Metric` / `Value` table.

Example:

| Metric | Value |
| --- | --- |
| Account Balance | $24.84M |
| Total Return | 41.8% |
| Win Rate | 68.4% |
| Drawdown | 5.2% |

### `Trades`

Expected columns:

| Date | Symbol | Side | Entry | Exit | PnL | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-24 | EUR/USD | Long | $1.0832 | $1.0896 | $162400 | Closed |

## Important

- Publish the Google Sheet tabs to the web so the frontend can read them.
- If no live sheet is configured, the site falls back to demo data.
