import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import StatsSection from '@/components/landing/StatsSection'
import AvailableColorsSection from '@/components/landing/AvailableColorsSection'
import ColorCombinationsSection from '@/components/landing/ColorCombinationsSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import CTASection from '@/components/landing/CTASection'
import { getSettings } from '@/lib/settings'

export const revalidate = 60

export default async function HomePage() {
  const settings = await getSettings()

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <AvailableColorsSection />
        {settings.display?.showStyleGuide && <ColorCombinationsSection />}
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
