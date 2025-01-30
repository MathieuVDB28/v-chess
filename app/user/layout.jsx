import Sidebar from '@/app/components/Sidebar'
import Navbar from '@/app/user/components/Navbar'
import Footer from '@/app/components/Footer'

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen">
      <div className="ml-64">
        <Navbar />
      </div>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
      <div className="ml-64">
        <Footer />
      </div>
    </div>
  );
} 