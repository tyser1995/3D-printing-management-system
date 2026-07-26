import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { FaFacebook, FaInstagram } from 'react-icons/fa'
import Image from 'next/image'

const footerLinks = {
  Shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Keychains', href: '/products?category=keychains' },
    { label: 'Figurines', href: '/products?category=figurines' },
    { label: 'Custom Orders', href: '/products?category=custom' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Contact', href: '/contact' },
  ],
  Support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Track Order', href: '/account/orders' },
    { label: 'Returns', href: '/returns' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-white">
              <Image src="/images/logo.svg" alt="KAI3D" width={40} height={40} priority />
              <span className="text-xl">
                Kai<span className="text-orange-400">3D</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Custom 3D-Printed Keychains, Fidgets, Name Plates, Souvenirs, Desk Accessories & More.
              Personalized designs for gifts, events, businesses, and everyday use.
              {/* Professional 3D printing services and management platform for custom keychains,
              figurines, and more. */}
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
              <a
                href="mailto:hello@kai3d.ph"
                className="flex items-center gap-2 hover:text-orange-400"
              >
                <Mail className="h-4 w-4" /> hello@kai3d.ph
              </a>
              <a href="tel:+639xxxxxxxxx" className="flex items-center gap-2 hover:text-orange-400">
                <Phone className="h-4 w-4" /> +63 9XX XXX XXXX
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Philippines
              </span>
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href="#"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-orange-400"
              >
                <FaFacebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-orange-400"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-300 uppercase">
                {group}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-orange-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Kai3D. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Built with <span className="text-orange-400">♥</span> in the Philippines
          </p>
        </div>
      </div>
    </footer>
  )
}
