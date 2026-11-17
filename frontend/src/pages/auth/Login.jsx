
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, LockKeyhole, Mail } from 'lucide-react'
import { loginUser, logoutUser } from '../../services/authService'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await loginUser(email, password)

      if (data.user.role !== 'provider') {
        logoutUser()
        setError('This account does not have provider access.')
        return
      }

      navigate('/provider/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to log in. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-5 py-10">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#647D68] text-white">
            <Scissors size={23} />
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#202421]">
            BookEase
          </h1>

          <p className="mt-2 text-sm text-[#777D76]">
            Provider workspace
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7E8E4] bg-white p-8 shadow-sm">

          <h2 className="text-xl font-semibold text-[#202421]">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-[#777D76]">
            Sign in to manage your business and bookings.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-[#202421]">
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-lg border border-[#E7E8E4] px-3 focus-within:border-[#647D68]">
                <Mail size={18} className="text-[#999E98]" />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#202421]">
                Password
              </label>

              <div className="flex items-center gap-3 rounded-lg border border-[#E7E8E4] px-3 focus-within:border-[#647D68]">
                <LockKeyhole size={18} className="text-[#999E98]" />

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#647D68] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#526D57] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-[#999E98]">
            Secure access to your BookEase provider account.
          </p>

        </div>
      </div>
    </main>
  )
}

export default Login
