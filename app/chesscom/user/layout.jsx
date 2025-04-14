import Sidebar from '@/app/components/Sidebar'
import Navbar from '@/app/components/NavbarUser'
import Footer from '@/app/components/Footer'

export default function UserLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="fixed h-screen w-64" />
      <div className="flex flex-col w-full lg:ml-64">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer className="mt-auto" />
      </div>
    </div>
  );
}