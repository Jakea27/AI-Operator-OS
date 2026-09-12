/// <reference types="vite/client" />

declare const __APP_BUILD_TIMESTAMP__: string
declare const __APP_BUILD_MODE__: string

interface Window {
  operatorOS?: {
    platform: string
    version: string
    contentProduction: import('./core/contentProduction').ContentProductionBridge
  }
}
