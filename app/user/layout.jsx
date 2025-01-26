import Sidebar from '@/app/components/Sidebar'

export default function UserLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
} 