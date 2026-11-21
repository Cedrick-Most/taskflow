function getCookie(name) {
  for (const cookie of document.cookie.split(';')) {
    const trimmed = cookie.trim()

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(
        trimmed.substring(name.length + 1)
      )
    }
  }

  return ''
}

export async function prepareCsrf() {
  const response = await fetch('/api/accounts/csrf/', {
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error('Could not initialize security settings.')
  }
}

export async function apiRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const changingData = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  const headers = {
    ...options.headers,
  }

  if (changingData) {
    const csrfToken = getCookie('csrftoken')

    if (!csrfToken) {
      throw new Error(
        'CSRF token is missing. Please refresh the page and try again.'
      )
    }

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