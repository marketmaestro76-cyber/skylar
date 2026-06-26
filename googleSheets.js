const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID
const DASHBOARD_TAB = import.meta.env.VITE_GOOGLE_SHEET_DASHBOARD_TAB || 'Dashboard'
const TRADES_TAB = import.meta.env.VITE_GOOGLE_SHEET_TRADES_TAB || 'Trades'

const METRIC_ALIASES = {
  accountbalance: 'accountBalance',
  balance: 'accountBalance',
  totalreturn: 'totalReturn',
  totalreturnpct: 'totalReturn',
  totalreturnpercent: 'totalReturn',
  winrate: 'winRate',
  winpercentage: 'winRate',
  drawdown: 'drawdown',
  maxdrawdown: 'drawdown',
}

function normalizeKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function cellValue(cell) {
  if (!cell) {
    return ''
  }

  return cell.f ?? cell.v ?? ''
}

function tableToObjects(table) {
  const headers = table.cols.map((column, index) => {
    const label = column.label || `column_${index + 1}`
    return normalizeKey(label)
  })

  return table.rows
    .map((row) => {
      const record = {}

      headers.forEach((header, index) => {
        record[header] = cellValue(row.c?.[index])
      })

      return record
    })
    .filter((row) => Object.values(row).some((value) => String(value).trim() !== ''))
}

async function fetchSheetTab(tabName) {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=` +
    `${encodeURIComponent(tabName)}&tqx=out:json`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Google Sheets request failed for ${tabName}`)
  }

  const text = await response.text()
  const match = text.match(/setResponse\(([\s\S]+)\);/)

  if (!match) {
    throw new Error(`Unable to parse Google Sheets response for ${tabName}`)
  }

  const payload = JSON.parse(match[1])
  return tableToObjects(payload.table)
}

function pickFirstValue(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && String(row[alias]).trim() !== '') {
      return row[alias]
    }
  }

  return ''
}

function parseDashboard(rows) {
  const dashboard = {
    accountBalance: 'N/A',
    totalReturn: 'N/A',
    winRate: 'N/A',
    drawdown: 'N/A',
  }

  rows.forEach((row) => {
    const directEntries = Object.entries(row)

    directEntries.forEach(([key, value]) => {
      const canonicalKey = METRIC_ALIASES[key]

      if (canonicalKey && String(value).trim() !== '') {
        dashboard[canonicalKey] = String(value)
      }
    })

    const metricName = normalizeKey(row.metric || row.name || row.kpi || row.label)
    const metricValue = row.value || row.amount || row.metricvalue
    const canonicalKey = METRIC_ALIASES[metricName]

    if (canonicalKey && String(metricValue).trim() !== '') {
      dashboard[canonicalKey] = String(metricValue)
    }
  })

  return dashboard
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  const normalized = String(value).replace(/[^0-9.-]+/g, '')
  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value) {
  const sign = value < 0 ? '-' : ''
  const absoluteValue = Math.abs(value)

  return `${sign}$${absoluteValue.toLocaleString('en-US', {
    maximumFractionDigits: absoluteValue >= 1000 ? 0 : 2,
  })}`
}

function parseTrades(rows) {
  return rows
    .map((row) => {
      const pnlValue = parseNumber(
        pickFirstValue(row, ['pnl', 'profitloss', 'netpnl', 'profit', 'returnusd']),
      )

      return {
        date: String(pickFirstValue(row, ['date', 'tradedate'])) || 'N/A',
        symbol: String(pickFirstValue(row, ['symbol', 'ticker', 'market', 'asset'])) || 'N/A',
        side: String(pickFirstValue(row, ['side', 'direction'])) || 'N/A',
        entry: String(pickFirstValue(row, ['entry', 'entryprice', 'avgentry'])) || 'N/A',
        exit: String(pickFirstValue(row, ['exit', 'exitprice', 'avgexit'])) || 'N/A',
        pnl: String(
          pickFirstValue(row, ['pnl', 'profitloss', 'netpnl', 'profit', 'returnusd']) ||
            formatCurrency(pnlValue),
        ),
        pnlValue,
        status: String(pickFirstValue(row, ['status', 'result'])) || 'Closed',
      }
    })
    .filter((trade) => trade.symbol !== 'N/A')
}

function parseCompactCurrency(value) {
  const text = String(value).trim().replace(/,/g, '')
  const match = text.match(/(-?\d+(?:\.\d+)?)([kmb])?/i)

  if (!match) {
    return 1000000
  }

  const numericValue = Number.parseFloat(match[1])
  const suffix = match[2]?.toLowerCase()
  const multiplier =
    suffix === 'b' ? 1000000000 : suffix === 'm' ? 1000000 : suffix === 'k' ? 1000 : 1

  return numericValue * multiplier
}

function buildEquityCurve(trades, accountBalance) {
  const baseBalance = parseCompactCurrency(accountBalance)
  const orderedTrades = [...trades].reverse()

  if (orderedTrades.length === 0) {
    return [
      {
        label: 'Starting Balance',
        value: baseBalance,
      },
    ]
  }

  let runningBalance = baseBalance - orderedTrades.reduce((sum, trade) => sum + trade.pnlValue, 0)

  return orderedTrades.map((trade) => {
    runningBalance += trade.pnlValue

    return {
      label: trade.date,
      value: Number(runningBalance.toFixed(2)),
    }
  })
}

export async function getPortfolioData() {
  if (!SHEET_ID) {
    throw new Error('Missing VITE_GOOGLE_SHEET_ID')
  }

  const [dashboardRows, tradesRows] = await Promise.all([
    fetchSheetTab(DASHBOARD_TAB),
    fetchSheetTab(TRADES_TAB),
  ])

  const dashboard = parseDashboard(dashboardRows)
  const trades = parseTrades(tradesRows)
  const equityCurve = buildEquityCurve(trades, dashboard.accountBalance)

  return {
    dashboard,
    trades,
    equityCurve,
  }
}

export function buildFallbackEquityCurve(trades, accountBalance) {
  return buildEquityCurve(trades, accountBalance)
}
