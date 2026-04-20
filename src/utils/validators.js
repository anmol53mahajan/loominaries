const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  return emailRegex.test(email)
}

export function validateAuthForm(email, password) {
  if (!email || !password) {
    return 'Email and password are required.'
  }

  if (!validateEmail(email)) {
    return 'Please enter a valid email address.'
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long.'
  }

  return ''
}
