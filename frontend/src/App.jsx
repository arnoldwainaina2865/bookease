
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import UnifiedAuth from './pages/auth/UnifiedAuth'

import ProviderDashboard from './pages/provider/ProviderDashboard'
import Bookings from './pages/provider/Bookings'
import Services from './pages/provider/Services'
import Customers from './pages/provider/Customers'
import Settings from './pages/provider/Settings'

import CustomerDashboard from './pages/customer/CustomerDashboard'
import BookAppointment from './pages/customer/BookAppointment'
import CustomerBookings from './pages/customer/CustomerBookings'
import CustomerLayout from './components/layout/CustomerLayout'
import Profile from './pages/profile/Profile'
import ChangePassword from './pages/profile/ChangePassword'
import DashboardLayout from './components/layout/DashboardLayout'

import {
  getCurrentUser,
  isAuthenticated,
} from './services/authService'


// Protect provider-only pages.
function ProviderRoute({ children }) {
  const user = getCurrentUser()

  if (!isAuthenticated() || !user || user.role !== 'provider') {
    return <Navigate to="/login" replace />
  }

  return children
}


// Protect customer-only pages.
function CustomerRoute({ children }) {
  const user = getCurrentUser()

  if (!isAuthenticated() || !user || user.role !== 'customer') {
    return <Navigate to="/login" replace />
  }

  return children
}


// Redirect authenticated users to their correct workspace.
function HomeRedirect() {
  const user = getCurrentUser()

  if (isAuthenticated() && user?.role === 'provider') {
    return <Navigate to="/provider/dashboard" replace />
  }

  if (isAuthenticated() && user?.role === 'customer') {
    return <Navigate to="/customer/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}


// Unified authentication route.
function AuthRoute() {
  const user = getCurrentUser()

  if (isAuthenticated() && user?.role === 'provider') {
    return <Navigate to="/provider/dashboard" replace />
  }

  if (isAuthenticated() && user?.role === 'customer') {
    return <Navigate to="/customer/dashboard" replace />
  }

  return <UnifiedAuth />
}


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<HomeRedirect />} />

        {/* Unified authentication */}
        <Route path="/login" element={<AuthRoute />} />
        <Route path="/register" element={<AuthRoute />} />
        <Route path="/customer/login" element={<AuthRoute />} />
        <Route path="/customer/register" element={<AuthRoute />} />


        {/* Provider workspace */}
        <Route
          path="/provider/dashboard"
          element={
            <ProviderRoute>
              <ProviderDashboard />
            </ProviderRoute>
          }
        />

        <Route
          path="/provider/bookings"
          element={
            <ProviderRoute>
              <Bookings />
            </ProviderRoute>
          }
        />

        <Route
          path="/provider/services"
          element={
            <ProviderRoute>
              <Services />
            </ProviderRoute>
          }
        />

        <Route
          path="/provider/customers"
          element={
            <ProviderRoute>
              <Customers />
            </ProviderRoute>
          }
        />

        <Route
  path="/provider/settings"
  element={
    <ProviderRoute>
      <Settings />
    </ProviderRoute>
  }
/>
<Route
  path="/provider/profile"
  element={
    <ProviderRoute>
      <DashboardLayout>
        <Profile />
      </DashboardLayout>
    </ProviderRoute>
  }
/>
<Route
  path="/provider/change-password"
  element={
    <ProviderRoute>
      <DashboardLayout>
        <ChangePassword />
      </DashboardLayout>
    </ProviderRoute>
  }
/>


        {/* Customer workspace */}
        <Route
          path="/customer/dashboard"
          element={
            <CustomerRoute>
              <CustomerLayout>
                <CustomerDashboard />
              </CustomerLayout>
            </CustomerRoute>
          }
        />

        <Route
          path="/customer/book"
          element={
            <CustomerRoute>
              <CustomerLayout>
                <BookAppointment />
              </CustomerLayout>
            </CustomerRoute>
          }
        />

        <Route
          path="/customer/bookings"
          element={
            <CustomerRoute>
              <CustomerLayout>
                <CustomerBookings />
              </CustomerLayout>
            </CustomerRoute>
          }
        />
        <Route
  path="/customer/profile"
  element={
    <CustomerRoute>
      <CustomerLayout>
        <Profile />
      </CustomerLayout>
    </CustomerRoute>
  }
/>

<Route
  path="/customer/change-password"
  element={
    <CustomerRoute>
      <CustomerLayout>
        <ChangePassword />
      </CustomerLayout>
    </CustomerRoute>
  }
/>

        {/* Unknown routes */}
        <Route path="*" element={<HomeRedirect />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
