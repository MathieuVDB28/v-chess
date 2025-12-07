'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'iconoir-react';
import Navbar from '@/app/components/Navbar';

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            setError('Une erreur s\'est produite lors de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4 py-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
                        <p className="text-foreground/60 text-xl">
                            Connectez-vous à votre compte
                        </p>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
                                <div className="w-1 h-12 bg-destructive rounded-full" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                                    Email
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'email' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="votre@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
                                    Mot de passe
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'password' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-background font-semibold py-3 px-4 rounded-lg
                                         hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
                                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                         flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        <span>Connexion en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        <span>Se connecter</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-input"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-foreground/50">
                                    ou
                                </span>
                            </div>
                        </div>

                        {/* Sign Up Link */}
                        <div className="text-center">
                            <p className="text-sm text-foreground/60">
                                Vous n'avez pas de compte ?{' '}
                                <Link
                                    href="/auth/signup"
                                    className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors duration-300"
                                >
                                    Créer un compte
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-8 text-center animate-in fade-in duration-1000 delay-300">
                        <Link
                            href="/"
                            className="text-sm text-foreground/40 hover:text-primary transition-colors duration-300"
                        >
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}