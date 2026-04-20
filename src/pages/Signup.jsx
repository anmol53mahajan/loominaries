import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useAuth } from '../hooks/useAuth'
import { validateAuthForm } from '../utils/validators'

function getFirebaseSignupMessage(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Please choose a stronger password.'
    default:
      return 'Unable to create account. Please try again.'
  }
}

function getGoogleAuthMessage(error) {
  switch (error?.code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was canceled.'
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'This email is already linked with another sign-in method.'
    default:
      return 'Google sign-in failed. Please try again.'
  }
}

export default function Signup() {
  const navigate = useNavigate()
  const { signup, loginWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateAuthForm(email.trim(), password)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await signup(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (firebaseError) {
      setError(getFirebaseSignupMessage(firebaseError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignup() {
    setError('')
    setIsGoogleLoading(true)

    try {
      await loginWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (firebaseError) {
      setError(getGoogleAuthMessage(firebaseError))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Join Loominaries to unlock your AI committee assistant.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="delegate@loominaries.ai"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <GoogleSignInButton
            onClick={handleGoogleSignup}
            disabled={isSubmitting || isGoogleLoading}
            loadingText="Signing in with Google..."
          />
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
