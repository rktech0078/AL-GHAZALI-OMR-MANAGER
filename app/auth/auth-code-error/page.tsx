import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <p className="text-gray-600">
          There was a problem authenticating your account. The link may have
          expired or been used already.
        </p>
        <Link href="/login" className="inline-block px-4 py-2 mt-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Return to Login
        </Link>
      </div>
    </div>
  )
}
