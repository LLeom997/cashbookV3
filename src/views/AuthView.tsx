import React, { useState } from 'react';
import { signInUser, signUpUser } from '../services/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { WalletIcon, MailIcon, LockIcon, ArrowRightIcon } from 'lucide-react';

export const AuthView = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInUser(email, password);
        toast.success('Welcome back!');
        onLogin();
      } else {
        const user = await signUpUser(email, password);

        if (user?.identities?.length === 0) {
          toast.info('Account created. Check your email to confirm it before logging in.');
          setIsLogin(true);
        } else if (user) {
          toast.success('Account created successfully.');
          onLogin();
        } else {
          throw new Error('Sign up failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication failed';
      if (msg.includes('Failed to fetch')) {
        msg = 'Connection error: could not reach Supabase. Check your config and network connection.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 mb-4">
            <WalletIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">CashFlow Pro</h1>
          <p className="text-slate-500 font-medium">Manage your daily business finances with ease</p>
        </div>

        <Card className="border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-black uppercase tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="font-medium">
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Sign up to start managing your business cash flow'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    className="pl-10 h-12 border-slate-200 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    minLength={6}
                    className="pl-10 h-12 border-slate-200 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-100 mt-2"
              >
                {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 bg-slate-50/50 border-t border-slate-100 p-6">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
              }}
              className="text-blue-600 font-bold hover:text-blue-700 p-0 h-auto"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Securely powered by Supabase
        </p>
      </div>
    </div>
  );
};
