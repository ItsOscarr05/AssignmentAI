export default function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    </div>
  );
}
