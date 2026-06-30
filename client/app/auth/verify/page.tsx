'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/common/Navbar'
import toast from 'react-hot-toast'

function VerifyContent() {
  const [verifying, setVerifying] = useState(true)
  const { verifyEmail } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyEmail(token)
        .then(() => {
          toast.success('Email verified successfully!')
          router.push('/auth/login')
        })
        .catch((error: any) => {
          toast.error(error.response?.data?.message || 'Verification failed')
          setVerifying(false)
        })
    } else {
      setVerifying(false)
    }
  }, [searchParams, verifyEmail, router])

  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      {verifying ? (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-primary">Verifying your email...</p>
        </>
      ) : (
        <p className="text-text-primary">Invalid verification link</p>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16">
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-primary">Loading...</p>
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  )
}
