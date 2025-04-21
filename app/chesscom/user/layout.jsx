import Sidebar from '@/app/components/Sidebar'
import Navbar from '@/app/components/NavbarUser'
import Footer from '@/app/components/Footer'

export default function UserLayout({ children }) {
    return (
        <div className="flex overflow-hidden">
            <Sidebar className="fixed h-screen w-64" />
            <div className="flex flex-col w-full lg:ml-64">
                <Navbar />
                <main className="flex-grow overflow-auto">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}