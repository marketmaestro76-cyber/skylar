import { useEffect, useMemo, useState } from 'react'
import { fallbackPortfolioData } from './data/fallbackData'
import { buildFallbackEquityCurve, getPortfolioData } from './lib/googleSheets'

function App() {
  const [portfolioData, setPortfolioData] = useState(() => ({
    ...fallbackPortfolioData,
    equityCurve: buildFallbackEquityCurve(
      fallbackPortfolioData.trades,
      fallbackPortfolioData.dashboard.accountBalance,
    ),
  }))
  const [loadingState, setLoadingState] = useState('loading')
  const [sheetMessage, setSheetMessage] = useState('Connecting to Google Sheets...')
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPortfolioData() {
      try {
        const liveData = await getPortfolioData()

        if (!isMounted) {
          return
        }

        setPortfolioData(liveData)
        setLoadingState('live')
        setSheetMessage('Live portfolio data loaded from Google Sheets.')
      } catch {
        if (!isMounted) {
          return
        }

        setLoadingState('fallback')
        setSheetMessage(
          'Showing demo data. Add your Google Sheet ID in `.env.local` and publish the sheet tabs to the web to load live portfolio data.',
        )
      }
    }

    loadPortfolioData()

    return () => {
      isMounted = false
    }
  }, [])

  const chart = useMemo(() => {
    const width = 760
    const height = 260
    const padding = 18
    const values = portfolioData.equityCurve.map((point) => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const points = portfolioData.equityCurve.map((point, index) => {
      const x =
        padding +
        (index / Math.max(portfolioData.equityCurve.length - 1, 1)) * (width - padding * 2)
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2)

      return { x, y, value: point.value, label: point.label }
    })

    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ')

    const areaPath = `${linePath} L ${points.at(-1)?.x ?? width - padding} ${height - padding} L ${
      points[0]?.x ?? padding
    } ${height - padding} Z`

    return {
      width,
      height,
      min,
      max,
      points,
      linePath,
      areaPath,
    }
  }, [portfolioData.equityCurve])

  function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  const stats = [
    {
      label: 'Account Balance',
      value: portfolioData.dashboard.accountBalance,
    },
    {
      label: 'Total Return',
      value: portfolioData.dashboard.totalReturn,
    },
    {
      label: 'Win Rate',
      value: portfolioData.dashboard.winRate,
    },
    {
      label: 'Drawdown',
      value: portfolioData.dashboard.drawdown,
    },
  ]

  return (
    <div className="relative overflow-hidden bg-[#070707] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,162,39,0.22),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-40 h-96 bg-[radial-gradient(circle,rgba(201,162,39,0.08),transparent_58%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-[#3a3020] bg-black/35 px-4 py-3 text-sm text-[#d8c089] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.9)]" />
            <span className="font-medium tracking-[0.35em] uppercase">Skylar Capital</span>
          </div>
          <nav className="hidden gap-6 text-xs uppercase tracking-[0.25em] text-[#b7a06a] md:flex">
            <a href="#dashboard">Dashboard</a>
            <a href="#equity">Equity Curve</a>
            <a href="#trades">Trades</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>

        <section className="grid items-center gap-10 px-1 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-[#4d3c12] bg-[#1a1509]/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.35em] text-[#e3c66f]">
              Professional Quantitative Trading
            </div>

            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.35em] text-[#8d7848]">Alternative Investment Platform</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-[#fff4d5] sm:text-6xl lg:text-7xl">
                Skylar Capital
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#b3aca1]">
                Institutional-grade portfolio intelligence for investors seeking disciplined,
                data-driven execution across macro, index, and FX markets.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-[#d4af37] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#e6c663]"
              >
                Request Investor Pack
              </a>
              <a
                href="#dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[#5a4820] bg-black/30 px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#e3c66f] transition hover:border-[#d4af37] hover:text-[#ffe9a6]"
              >
                View Performance
              </a>
            </div>

            <div
              className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm ${
                loadingState === 'live'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : loadingState === 'loading'
                    ? 'border-[#5a4820] bg-black/30 text-[#c8b380]'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              <span>{sheetMessage}</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#3c3018] bg-[linear-gradient(180deg,rgba(31,25,12,0.88),rgba(11,11,11,0.96))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-[#3c3018] pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8f7a49]">Live Allocation</p>
                <h2 className="mt-3 text-2xl font-semibold text-[#fff2c6]">Quantitative Strategy Overview</h2>
              </div>
              <div className="rounded-full border border-[#5a4820] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#d7b95d]">
                Since 2019
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#3b2f18] bg-black/25 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">Core Alpha</p>
                <p className="mt-4 text-4xl font-semibold text-[#fff2c6]">12.6%</p>
                <p className="mt-2 text-sm text-[#a8a190]">Annualized volatility targeting with dynamic risk controls.</p>
              </div>
              <div className="rounded-3xl border border-[#3b2f18] bg-black/25 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">Execution Edge</p>
                <p className="mt-4 text-4xl font-semibold text-[#fff2c6]">24/5</p>
                <p className="mt-2 text-sm text-[#a8a190]">Systematic market monitoring with adaptive trade selection.</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[#3b2f18] bg-black/25 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">Prime Objective</p>
                  <p className="mt-2 text-lg font-medium text-[#f8ecc7]">Asymmetric upside with controlled downside exposure.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8f7a49]">Liquidity</p>
                  <p className="mt-2 text-xl font-semibold text-[#ffe39b]">Daily</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="dashboard" className="space-y-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#8f7a49]">Statistics Dashboard</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#fff2c6]">Performance Snapshot</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#9c9689]">
              Portfolio metrics are designed to pull directly from Google Sheets, allowing the
              public site to stay synchronized with your internal reporting workflow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[1.75rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(19,16,11,0.95),rgba(8,8,8,0.95))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">{stat.label}</p>
                <p className="mt-6 text-4xl font-semibold text-[#fff1bf]">{stat.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="equity" className="grid gap-6 py-12 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(16,13,10,0.98),rgba(8,8,8,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-3 border-b border-[#332915] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#8f7a49]">Equity Curve Chart</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#fff2c6]">Capital Growth Trajectory</h2>
              </div>
              <p className="text-sm text-[#9e9889]">Built from recent trade P&amp;L values loaded from Google Sheets.</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#3a2d17] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_35%),rgba(0,0,0,0.22)] p-4 sm:p-6">
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                className="h-[280px] w-full"
                role="img"
                aria-label="Equity curve chart"
              >
                <defs>
                  <linearGradient id="equityStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7a5a12" />
                    <stop offset="50%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#ffedaa" />
                  </linearGradient>
                  <linearGradient id="equityFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(212,175,55,0.42)" />
                    <stop offset="100%" stopColor="rgba(212,175,55,0.02)" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((line) => (
                  <line
                    key={line}
                    x1="18"
                    y1={18 + ((chart.height - 36) / 3) * line}
                    x2={chart.width - 18}
                    y2={18 + ((chart.height - 36) / 3) * line}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="5 8"
                  />
                ))}

                <path d={chart.areaPath} fill="url(#equityFill)" />
                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="url(#equityStroke)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {chart.points.map((point) => (
                  <circle
                    key={`${point.label}-${point.value}`}
                    cx={point.x}
                    cy={point.y}
                    r="4.5"
                    fill="#f9df8b"
                    stroke="#16120a"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          </div>

          <aside className="space-y-4 rounded-[2rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(16,13,10,0.98),rgba(8,8,8,0.96))] p-6">
            <div className="rounded-3xl border border-[#3a2d17] bg-black/30 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">Curve Peak</p>
              <p className="mt-4 text-3xl font-semibold text-[#fff2c6]">
                {chart.max.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="rounded-3xl border border-[#3a2d17] bg-black/30 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">Curve Floor</p>
              <p className="mt-4 text-3xl font-semibold text-[#fff2c6]">
                {chart.min.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="rounded-3xl border border-[#3a2d17] bg-black/30 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[#8f7a49]">Observation</p>
              <p className="mt-4 text-base leading-7 text-[#b8b09b]">
                The curve visual emphasizes consistent upward compounding while preserving a
                discreet institutional presentation.
              </p>
            </div>
          </aside>
        </section>

        <section id="trades" className="space-y-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#8f7a49]">Recent Trades Table</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#fff2c6]">Recent Execution Log</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#9e9889]">
              Designed for public transparency while maintaining the refined tone of a private
              investment firm.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(16,13,10,0.98),rgba(8,8,8,0.96))]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#312713] text-left">
                <thead className="bg-[#120f0b] text-xs uppercase tracking-[0.25em] text-[#9b8551]">
                  <tr>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">Symbol</th>
                    <th className="px-5 py-4 font-medium">Side</th>
                    <th className="px-5 py-4 font-medium">Entry</th>
                    <th className="px-5 py-4 font-medium">Exit</th>
                    <th className="px-5 py-4 font-medium">P&amp;L</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#231c10] text-sm text-[#ddd1ad]">
                  {portfolioData.trades.map((trade) => (
                    <tr key={`${trade.date}-${trade.symbol}-${trade.side}`} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4 text-[#a8a190]">{trade.date}</td>
                      <td className="px-5 py-4 font-medium text-[#fff0bf]">{trade.symbol}</td>
                      <td className="px-5 py-4">{trade.side}</td>
                      <td className="px-5 py-4 text-[#a8a190]">{trade.entry}</td>
                      <td className="px-5 py-4 text-[#a8a190]">{trade.exit}</td>
                      <td
                        className={`px-5 py-4 font-semibold ${
                          trade.pnlValue >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {trade.pnl}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-[#4a3b1b] bg-[#171208] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#e1c56e]">
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="about" className="grid gap-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(16,13,10,0.98),rgba(8,8,8,0.96))] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[#8f7a49]">About Skylar Capital</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#fff2c6]">A modern hedge fund presentation for sophisticated allocators.</h2>
          </div>

          <div className="space-y-5 rounded-[2rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(16,13,10,0.98),rgba(8,8,8,0.96))] p-6 text-base leading-8 text-[#b9b19d]">
            <p>
              Skylar Capital combines systematic research, quantitative execution, and disciplined
              risk management to pursue resilient performance across liquid global markets.
            </p>
            <p>
              This website is structured to present an institutional-quality first impression while
              remaining easy to maintain through Google Sheets-powered data updates.
            </p>
            <p>
              The design language uses deep blacks, warm metallic highlights, and restrained motion
              cues to communicate confidence, exclusivity, and control.
            </p>
          </div>
        </section>

        <section id="contact" className="py-4 pb-16">
          <div className="grid gap-6 rounded-[2rem] border border-[#332915] bg-[linear-gradient(180deg,rgba(16,13,10,0.98),rgba(8,8,8,0.96))] p-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.3em] text-[#8f7a49]">Contact Form</p>
              <h2 className="text-3xl font-semibold text-[#fff2c6]">Start a conversation with the Skylar Capital team.</h2>
              <p className="max-w-xl text-base leading-8 text-[#b9b19d]">
                Capture inbound investor interest with a refined contact experience that matches
                the rest of the site. The form can later be connected to your CRM or email API.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-[#d1c29c]">
                  Full Name
                  <input
                    type="text"
                    required
                    placeholder="Jane Carter"
                    className="rounded-2xl border border-[#4a3b1b] bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-[#6f6756] focus:border-[#d4af37]"
                  />
                </label>
                <label className="grid gap-2 text-sm text-[#d1c29c]">
                  Email
                  <input
                    type="email"
                    required
                    placeholder="investor@example.com"
                    className="rounded-2xl border border-[#4a3b1b] bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-[#6f6756] focus:border-[#d4af37]"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-[#d1c29c]">
                Company
                <input
                  type="text"
                  placeholder="Institution or family office"
                  className="rounded-2xl border border-[#4a3b1b] bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-[#6f6756] focus:border-[#d4af37]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[#d1c29c]">
                Message
                <textarea
                  required
                  rows="5"
                  placeholder="Tell us about your allocation mandate, target strategy, or diligence process."
                  className="rounded-2xl border border-[#4a3b1b] bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-[#6f6756] focus:border-[#d4af37]"
                />
              </label>
              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-[#e7c968]"
                >
                  Send Inquiry
                </button>
                {isSubmitted ? (
                  <p className="text-sm text-emerald-300">Message captured. Connect this form to your preferred backend next.</p>
                ) : (
                  <p className="text-sm text-[#8f8878]">Investor inquiries can be routed to email, HubSpot, or a secure CRM endpoint.</p>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
