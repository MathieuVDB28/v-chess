import Sidebar from '@/app/components/Sidebar'
import Navbar from '@/app/user/components/Navbar'
import Footer from '@/app/components/Footer'

export default function UserLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="ml-64">
        <Navbar />
      </div>
      <Sidebar />
      <main className="flex-grow ml-64">
        {children}
      </main>
      <div className="ml-64 mt-6">
        <Footer />
      </div>
    </div>
  );
} 