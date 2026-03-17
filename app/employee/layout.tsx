import { ReactNode } from 'react'
import EmployeeHeader from '@/components/EmployeeHeader'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Employee Dashboard - Washlee Pro',
  description: 'Manage your orders, jobs, and earnings as a Washlee Pro employee',
}

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-slate-900 to-dark flex flex-col">
      <EmployeeHeader />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
