import packageInfo from '../../package.json'

export type BuildInfo = {
  version: string
  timestamp: string
  mode: string
  bundleFile: string
  bundleHash: string
}

function getFrontendBundleFile() {
  if (typeof document === 'undefined') return 'Unavailable'

  const script = Array.from(document.scripts)
    .map((item) => item.getAttribute('src') ?? '')
    .find((src) => src.includes('/assets/index-') || src.includes('./assets/index-'))

  if (!script) return 'Unavailable'

  return script.split('/').pop() ?? script
}

function getBundleHash(bundleFile: string) {
  const match = bundleFile.match(/index-(.+)\.js$/)
  return match?.[1] ?? 'Unavailable'
}

export function getBuildInfo(): BuildInfo {
  const bundleFile = getFrontendBundleFile()

  return {
    version: packageInfo.version,
    timestamp: __APP_BUILD_TIMESTAMP__,
    mode: __APP_BUILD_MODE__,
    bundleFile,
    bundleHash: getBundleHash(bundleFile),
  }
}

export function formatBuildTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp

  return date.toLocaleString()
}
