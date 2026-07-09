import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white sm:text-5xl">
          Ready to bring your ideas to life?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-orange-100">
          Join hundreds of customers who trust Kai3D for their custom 3D printing needs. Start your
          first order today.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-white text-orange-600 shadow-lg hover:bg-orange-50">
              Start Free Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/products">
            <Button
              variant="outline"
              size="lg"
              className="border-white/50 text-white hover:bg-white/10"
            >
              View Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
