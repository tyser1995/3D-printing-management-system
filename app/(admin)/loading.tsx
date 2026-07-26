import Spinner from '@/components/ui/Spinner'

export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size="lg" className="text-orange-500" />
    </div>
  )
}
