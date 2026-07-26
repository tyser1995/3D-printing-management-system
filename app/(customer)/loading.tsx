import Spinner from '@/components/ui/Spinner'

export default function CustomerLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" className="text-orange-500" />
    </div>
  )
}
