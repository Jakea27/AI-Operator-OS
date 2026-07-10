export type ProviderCatalogItem = {
  name: string
  category: string
}

export const providerCatalog: ProviderCatalogItem[] = [
  { name: 'OpenAI', category: 'AI Provider' },
  { name: 'Anthropic', category: 'AI Provider' },
  { name: 'Google', category: 'AI Provider' },
  { name: 'Local Model', category: 'AI Provider' },
  { name: 'GitHub', category: 'Development Tool' },
  { name: 'Gmail', category: 'Communication Tool' },
  { name: 'Microsoft 365', category: 'Productivity Tool' },
  { name: 'Google Maps', category: 'Location Tool' },
  { name: 'Stripe', category: 'Payment Tool' },
  { name: 'Playwright', category: 'Browser Tool' },
  { name: 'Docker', category: 'Infrastructure Tool' },
  { name: 'n8n', category: 'Automation Tool' },
  { name: 'ElevenLabs', category: 'Voice Tool' },
]
