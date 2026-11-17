
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LockKeyhole, Scissors } from 'lucide-react'

import { loginUser, logoutUser } from '../../services/authService'

function CustomerLogin() {
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
      const data = await loginUser(email.trim(), password)

      if (data.user.role !== 'customer') {
        logoutUser()
        setError('This account does not have customer access.')
        return
      }

      navigate('/customer/dashboard', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to sign in. Please check your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-5 py-12">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#647D68] text-white mb-4">
            <Scissors size={23} />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#202421]">
            BookEase
          </h1>

          <p className="mt-2 text-sm text-[#777D76]">
            Your appointments, made simple.
          </p>
        </div>

        <div className="bg-white border border-[#E7E8E4] rounded-2xl p-8 shadow-sm">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-[#202421]">
              Welcome back
            </h2>

            <p className="text-sm text-[#777D76] mt-2">
              Sign in to discover services and manage your appointments.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#202421] mb-2"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-[#E7E8E4] rounded-lg outline-none focus:border-[#647D68] text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#202421] mb-2"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929890]"
                />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-[#E7E8E4] rounded-lg outline-none focus:border-[#647D68] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#647D68] hover:bg-[#526A56] disabled:opacity-60 text-white font-medium rounded-lg py-3 text-sm transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-[#E7E8E4] text-center">
            <p className="text-sm text-[#777D76]">
              Are you a service provider?{' '}
              <Link
                to="/login"
                className="font-medium text-[#647D68] hover:underline"
              >
                Provider login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#929890] mt-6">
          Secure access to your BookEase customer account.
        </p>
      </section>
    </main>
  )
}

export default CustomerLogin
