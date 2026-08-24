import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, ShieldCheck, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi, setToken } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import logoImg from '@/assets/logo.png'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().default(false).optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginCard() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user, role, setUser, setSession } = useAuthStore()

  const isResolving = !!(user && !role)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      const result = await authApi.login(data.email, data.password)

      if (result.token) {
        setToken(result.token, !!data.rememberMe)
        const userWithFullName = {
          ...result.user,
          full_name: result.user.full_name || result.user.fullName || result.user.name || (result.user.email ? result.user.email.split('@')[0] : 'User'),
          fullName: result.user.fullName || result.user.full_name || result.user.name,
        }
        setUser(userWithFullName)
        setSession({ access_token: result.token })
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in to your workspace.',
        })
        // Force page reload to trigger AuthProvider's initAuth
        window.location.reload()
      }
    } catch (err: any) {
      toast({
        title: 'Authentication failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isResolving) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" />
        <div className="flex justify-center mb-6 mt-4">
          <img src={logoImg} alt="Logo" className="h-12 w-auto max-w-[200px] object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Setting Up Workspace</h2>
        <p className="text-sm text-slate-500 mt-2">Verifying your account role and permissions...</p>
        <div className="flex items-center justify-center mt-8 mb-4">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mr-2" />
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest animate-pulse">Resolving credentials</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-2xl p-6 sm:p-7 relative overflow-hidden my-auto"
    >
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="text-center mb-5">
        <div className="flex justify-center mb-3">
          <img src={logoImg} alt="Logo" className="h-10 w-auto max-w-[170px] object-contain hover:scale-105 transition-transform" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-500 mt-1">Sign in to continue to your workspace</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700">Email address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@company.com"
                    type="email"
                    disabled={isLoading}
                    className="bg-white/50 focus:bg-white transition-colors h-9 text-xs"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold text-slate-700">Password</FormLabel>
                  <a href="#" className="text-[11px] font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      disabled={isLoading}
                      className="bg-white/50 focus:bg-white transition-colors pr-9 h-9 text-xs"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[11px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-0.5">
                <FormControl>
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-xs font-medium text-slate-600 cursor-pointer">
                    Remember me
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all h-9 text-xs font-bold" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center space-x-5 text-[11px] text-slate-400">
        <div className="flex items-center">
          <Lock className="w-3 h-3 mr-1 text-slate-400" /> Secure
        </div>
        <div className="flex items-center">
          <ShieldCheck className="w-3 h-3 mr-1 text-slate-400" /> RBAC
        </div>
        <div className="flex items-center">
          <Lock className="w-3 h-3 mr-1 text-slate-400" /> Enterprise
        </div>
      </div>
      
      <p className="text-center text-[11px] text-slate-400 mt-3">
        Need help? <a href="#" className="hover:text-slate-700 underline underline-offset-2">Contact administrator.</a>
      </p>

      <div className="mt-2 text-center">
        <Link
          to="/home"
          className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-all"
        >
          <span>✨ Explore HRMS Showcase & Subscription Plans (/home) →</span>
        </Link>
      </div>
    </motion.div>
  )
}
