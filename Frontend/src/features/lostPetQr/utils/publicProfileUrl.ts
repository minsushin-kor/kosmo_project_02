function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function getConfiguredBaseUrl(configuredUrl: string | undefined) {
  return trimTrailingSlash(configuredUrl?.trim() || window.location.origin)
}

export function getQrPublicBaseUrl() {
  return getConfiguredBaseUrl(import.meta.env.VITE_PUBLIC_BASE_URL)
}

export function getLocalPreviewBaseUrl() {
  return getConfiguredBaseUrl(import.meta.env.VITE_LOCAL_BASE_URL)
}

export function buildLostPetProfileUrl(publicToken: string, baseUrl = getQrPublicBaseUrl()) {
  return `${trimTrailingSlash(baseUrl)}/lost-pet/${encodeURIComponent(publicToken)}`
}
