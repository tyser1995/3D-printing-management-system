import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">{children}</main>
      <Footer />
    </>
  )
}
