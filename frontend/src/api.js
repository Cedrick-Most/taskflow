
let csrfToken = ''

export async function prepareCsrf() {
  const response = await fetch('/api/accounts/csrf/', {
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Could not initialize security settings.')
  }

  const data = await response.json()
  csrfToken = data.csrfToken

  if (!csrfToken) {
    throw new Error('Could not obtain CSRF token.')
  }
}

export async function apiRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const changingData = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  if (changingData && !csrfToken) {
    await prepareCsrf()
  }

  const headers = {
    ...options.headers,
  }

  if (changingData) {
    headers['X-CSRFToken'] = csrfToken
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    const message =
      errorData.detail ||
      errorData.error ||
      `Request failed: ${response.status}`

    throw new Error(
      typeof message === 'string'
        ? message
        : JSON.stringify(message)
    )
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
