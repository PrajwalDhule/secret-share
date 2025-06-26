"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useCreateEncryptedSecret } from "@/hooks/useCreateSecret"
import { useState } from "react"
import { Copy, Eye, EyeOff, Lock, Clock, Shield, Key } from "lucide-react"

export default function CreateSecretPage() {
  const { data: session, status } = useSession()
  if (status !== "loading" && !session?.user) {
    redirect("/auth/sign-in")
  }

  const { create, isSuccess, data: result, error, reset } = useCreateEncryptedSecret()

  const [secret, setSecret] = useState("")
  const [expiresIn, setExpiresIn] = useState(3600)
  const [oneTime, setOneTime] = useState(false)
  const [password, setPassword] = useState("")
  const [storeKey, setStoreKey] = useState(true)
  const [generatedUrl, setGeneratedUrl] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!secret.trim()) return alert("Secret message is required")

    try {
      const url = await create(secret, expiresIn, oneTime, password || undefined, storeKey)
      setGeneratedUrl(url)
    } catch (err) {
      console.error(err)
    }
  }

  const resetForm = () => {
    setSecret("")
    setExpiresIn(3600)
    setOneTime(false)
    setPassword("")
    setGeneratedUrl("")
    setCopied(false)
    reset()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getExpiryLabel = (seconds: number) => {
    if (seconds === 300) return "5 minutes"
    if (seconds === 3600) return "1 hour"
    if (seconds === 86400) return "1 day"
    if (seconds === 604800) return "1 week"
    return `${seconds} seconds`
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Secret</h1>
                <p className="text-blue-100 text-sm">Share sensitive information securely</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {generatedUrl ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">Secret Created Successfully!</h2>
                  <p className="text-slate-600">Your secret has been encrypted and is ready to share.</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Secure Link</label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 break-all font-mono">
                      {generatedUrl}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        copied
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800 mb-1">Security Notice</h3>
                      <p className="text-sm text-amber-700">
                        This link will expire in <strong>{getExpiryLabel(expiresIn)}</strong>
                        {oneTime && " and can only be viewed once"}. Share it through a secure channel.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                >
                  Create Another Secret
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Secret Message *</label>
                  <textarea
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    required
                    rows={4}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Enter your secret message here..."
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expires In
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-8 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value={300}>5 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={86400}>1 day</option>
                    <option value={604800}>1 week</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={oneTime}
                      onChange={(e) => setOneTime(e.target.checked)}
                      id="oneTime"
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="oneTime" className="flex-1 text-sm font-medium text-slate-700">
                      One-time view only
                    </label>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={storeKey}
                      onChange={(e) => setStoreKey(e.target.checked)}
                      id="storeKey"
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="storeKey" className="flex-1 text-sm font-medium text-slate-700">
                      Store decryption key on server <br/> (less privacy but easy for later access on dashboard) <br/> (without this, you will need to save the url yourself)
                    </label>
                    <Key className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password Protection (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-12 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Add password protection"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-sm text-red-700 font-medium">{error.message}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <Lock className="w-5 h-5 inline mr-2" />
                  Create Encrypted Secret
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
