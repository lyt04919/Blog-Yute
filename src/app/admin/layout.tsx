import { ReactNode } from 'react'
import Link from 'next/link'
import { Book, Film, MapPin, Hammer, FileText, Settings, LayoutDashboard } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Blogs', path: '/admin?type=blogs', icon: FileText },
    { name: 'Projects', path: '/admin?type=projects', icon: Hammer },
    { name: 'Books', path: '/admin?type=books', icon: Book },
    { name: 'Movies', path: '/admin?type=movies', icon: Film },
    { name: 'Footprints', path: '/admin?type=footprints', icon: MapPin },
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Settings className="w-5 h-5 mr-3 text-blue-500" />
          <h1 className="font-bold text-lg">Central Admin</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.path}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
            &larr; Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
