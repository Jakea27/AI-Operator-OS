export const chartTheme = {
  grid: '#25302c',
  text: '#829089',
  lime: '#c8f560',
  mint: '#80e5bd',
  coral: '#ff9e8f',
  panel: '#111715',
  ink: '#090d0c',
}

export const currencyTick = (value: number) =>
  value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`

export const currencyValue = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
