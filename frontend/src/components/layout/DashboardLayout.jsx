
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
