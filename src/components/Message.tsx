import Link from 'next/link'
import React from 'react'

export default function Message({ message, url }: { message: string, url?: string }) {
  return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="no-data-card bg-white p-12 rounded-lg shadow-md max-w-md w-full">
          <div className="text-4xl mb-6">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            {message}
          </h1>
          {/* <p className="text-gray-600 dark:text-gray-400 mb-8">Go to Home Page</p> */}
          <Link href={url ?? "/"} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
            Go to Home Page
          </Link>
        </div>
      </div>
  )
}