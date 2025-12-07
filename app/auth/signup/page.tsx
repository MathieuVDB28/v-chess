"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Check } from 'iconoir-react';
import Image from 'next/image';
import Navbar from '@/app/components/Navbar';

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        chesscom_username: '',
        lichess_username: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (e:any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e:any) => {
        setTermsAccepted(e.target.checked);
    };

    const handleSubmit = async (e:any) => {
        e.preventDefault();

        // Validation côté client
        if (!formData.email || !formData.password) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        if (!termsAccepted) {
            setError('Vous devez accepter les conditions générales');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Appel à l'API d'inscription
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    chesscom_username: formData.chesscom_username || "", // Valeur par défaut vide
                    lichess_username: formData.lichess_username || ""    // Valeur par défaut vide
                }),
            });

            const data = await response.json();
            console.log('data : ' + data)

            if (!response.ok) {
                throw new Error(data.message || 'Une erreur est survenue');
            }

            // Redirection vers la page de connexion après inscription réussie
            router.push('/auth/signin?success=Account has been created');

        } catch (error:any) {
            setError(error?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4 py-2 overflow-y-auto">
                <div className="w-full max-w-lg my-2">
                    <div className="text-center mb-4 animate-in fade-in slide-in-from-top duration-700">
                        <p className="text-foreground/60 text-lg">
                            Créez votre compte pour commencer
                        </p>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
                                <div className="w-1 h-12 bg-destructive rounded-full" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Email Field */}
                            <div className="space-y-1">
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
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-2 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="votre@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Chess.com Username */}
                            <div className="space-y-1">
                                <label htmlFor="chesscom_username" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                    <Image
                                        src="/img/chesscom_logo.png"
                                        alt="Chess.com"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span>Chess.com username (optionnel)</span>
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'chesscom' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="chesscom_username"
                                        type="text"
                                        name="chesscom_username"
                                        value={formData.chesscom_username}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('chesscom')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-2 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="votre_pseudo"
                                    />
                                </div>
                            </div>

                            {/* Lichess Username */}
                            <div className="space-y-1">
                                <label htmlFor="lichess_username" className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                    <Image
                                        src="/img/lichess_logo.png"
                                        alt="Lichess"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span>Lichess username (optionnel)</span>
                                </label>
                                <div className="relative group">
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                        focusedField === 'lichess' ? 'text-primary' : 'text-foreground/40'
                                    }`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="lichess_username"
                                        type="text"
                                        name="lichess_username"
                                        value={formData.lichess_username}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('lichess')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-2 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="votre_pseudo"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1">
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
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full pl-11 pr-4 py-2 bg-background border-2 border-input rounded-lg
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-foreground/50">Minimum 8 caractères</p>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-input/50">
                                <div className="relative flex items-center">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={handleCheckboxChange}
                                        className="w-5 h-5 rounded border-2 border-input bg-background
                                                 checked:bg-primary checked:border-primary
                                                 focus:outline-none focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300 cursor-pointer
                                                 appearance-none relative
                                                 checked:after:content-['✓'] checked:after:absolute
                                                 checked:after:top-1/2 checked:after:left-1/2
                                                 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2
                                                 checked:after:text-background checked:after:text-xs checked:after:font-bold"
                                        required
                                    />
                                </div>
                                <label htmlFor="terms" className="text-sm text-foreground/70 cursor-pointer select-none">
                                    J'accepte les{' '}
                                    <Link href="#" className="text-primary hover:underline font-medium">
                                        conditions générales
                                    </Link>
                                    {' '}et la{' '}
                                    <Link href="#" className="text-primary hover:underline font-medium">
                                        politique de confidentialité
                                    </Link>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-background font-semibold py-2.5 px-4 rounded-lg
                                         hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
                                         focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                         flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                        <span>Création en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5 transition-transform group-hover:scale-110" />
                                        <span>Créer mon compte</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-input"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-foreground/50">
                                    ou
                                </span>
                            </div>
                        </div>

                        {/* Sign In Link */}
                        <div className="text-center">
                            <p className="text-sm text-foreground/60">
                                Vous avez déjà un compte ?{' '}
                                <Link
                                    href="/auth/signin"
                                    className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors duration-300"
                                >
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-4 text-center animate-in fade-in duration-1000 delay-300">
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