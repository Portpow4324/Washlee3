'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/login`
          : undefined

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send reset email'
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Back to sign in
        </Link>
        <Link href="/" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md surface-card p-6 sm:p-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mint mb-4">
            <Mail size={20} className="text-primary-deep" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">Reset your password</h1>
          <p className="text-sm text-gray mb-6">
            Enter the email on your Washlee account. We&rsquo;ll send you a secure link to set a new password.
          </p>

          {sent ? (
            <div className="rounded-2xl bg-mint border border-primary/20 p-5">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle size={20} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dark">Check your inbox</p>
                  <p className="text-sm text-gray">
                    If an account exists for <span className="font-semibold text-dark">{email}</span>, a reset link is on its way. It can take a couple of minutes — also check your spam folder.
                  </p>
                </div>
              </div>
              <Link href="/auth/login" className="btn-primary w-full mt-2">
                Back to sign in
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="label-field">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
                {!submitting && <ArrowRight size={16} />}
              </button>

              <p className="text-center text-sm text-gray pt-2">
                Remembered it?{' '}
                <Link href="/auth/login" className="text-primary-deep font-semibold hover:underline">
                  Sign in instead
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
