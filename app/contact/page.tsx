'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Mail, User, Send, MessageText, CheckCircle, NavArrowRight, NavArrowLeft, Home, UserSquare } from 'iconoir-react';
import Link from 'next/link';

export default function ContactPage() {
    const { data: session, status } = useSession();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simuler l'envoi du formulaire
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSuccess(true);

        // Réinitialiser le formulaire après 3 secondes
        setTimeout(() => {
            setIsSuccess(false);
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
        }, 3000);
    };

    const contactReasons = [
        {
            icon: <MessageText className="w-6 h-6" />,
            title: "Suggestion",
            description: "Proposez une amélioration"
        },
        {
            icon: <CheckCircle className="w-6 h-6" />,
            title: "Support",
            description: "Besoin d'aide ?"
        },
        {
            icon: <NavArrowRight className="w-6 h-6" />,
            title: "Bug Report",
            description: "Signalez un problème"
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-8 animate-in fade-in slide-in-from-left duration-500">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-foreground/60 hover:text-primary
                                     transition-colors duration-300 group"
                        >
                            <NavArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            <span className="text-sm font-medium">Retour à l'accueil</span>
                        </Link>
                    </div>

                    <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
                        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                            Contactez-nous
                        </h1>
                        <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                            Nous sommes à votre écoute pour améliorer V-Chess et répondre à vos questions
                        </p>
                    </div>

                    {/* Contact Reasons Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-150">
                        {contactReasons.map((reason, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-xl bg-card/30 backdrop-blur-sm border border-primary/10
                                         hover:border-primary/30 transition-all duration-300 hover:scale-105
                                         hover:shadow-lg hover:shadow-primary/10"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4
                                              group-hover:bg-primary/20 transition-colors duration-300 text-primary">
                                    {reason.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {reason.title}
                                </h3>
                                <p className="text-foreground/60 text-sm">
                                    {reason.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Main Contact Form */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl p-8 shadow-2xl
                                      animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                            {isSuccess && (
                                <div className="mb-6 p-4 bg-primary/10 border border-primary/20 text-primary rounded-lg
                                              flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
                                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Message envoyé avec succès !</p>
                                        <p className="text-sm text-primary/80">Nous vous répondrons dans les plus brefs délais.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name and Email Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-foreground/80">
                                            Nom complet
                                        </label>
                                        <div className="relative group">
                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                                focusedField === 'name' ? 'text-primary' : 'text-foreground/40'
                                            }`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="name"
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                         text-foreground placeholder:text-foreground/30
                                                         focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                         transition-all duration-300"
                                                placeholder="Votre nom"
                                                required
                                            />
                                        </div>
                                    </div>

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
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
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
                                </div>

                                {/* Subject Field */}
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="block text-sm font-medium text-foreground/80">
                                        Sujet
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                                            focusedField === 'subject' ? 'text-primary' : 'text-foreground/40'
                                        }`}>
                                            <MessageText className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="subject"
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('subject')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full pl-11 pr-4 py-3 bg-background border-2 border-input rounded-lg
                                                     text-foreground placeholder:text-foreground/30
                                                     focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                                                     transition-all duration-300"
                                            placeholder="Raison de votre message"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Message Field */}
                                <div className="space-y-2">
                                    <label htmlFor="message" className="block text-sm font-medium text-foreground/80">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('message')}
                                        onBlur={() => setFocusedField(null)}
                                        rows={6}
                                        className={`w-full px-4 py-3 bg-background border-2 rounded-lg resize-none
                                                 text-foreground placeholder:text-foreground/30
                                                 focus:outline-none focus:ring-2 focus:ring-primary/20
                                                 transition-all duration-300 ${
                                                     focusedField === 'message' ? 'border-primary' : 'border-input'
                                                 }`}
                                        placeholder="Décrivez-nous votre demande en détail..."
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary text-background font-semibold py-4 px-6 rounded-lg
                                             hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30
                                             focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                             flex items-center justify-center gap-2 group"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                            <span>Envoi en cours...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                            <span>Envoyer le message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
                            <p className="text-foreground/60 text-sm mb-2">
                                Vous pouvez également nous contacter par email à{' '}
                                <a
                                    href="mailto:contact@v-chess.com"
                                    className="text-primary hover:underline font-medium transition-colors"
                                >
                                    contact@v-chess.com
                                </a>
                            </p>
                            <p className="text-foreground/50 text-xs mb-6">
                                Nous nous engageons à répondre dans un délai de 24-48 heures
                            </p>

                            {/* Quick Links */}
                            <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-input/30">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-primary
                                             transition-colors duration-300 group"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Accueil</span>
                                </Link>
                                <span className="text-foreground/30">•</span>
                                <Link
                                    href={status === 'authenticated' ? '/account' : '/auth/signin'}
                                    className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-primary
                                             transition-colors duration-300"
                                >
                                    <UserSquare className="w-4 h-4" />
                                    <span>Mon compte</span>
                                </Link>
                                <span className="text-foreground/30">•</span>
                                <Link
                                    href={
                                        status === 'authenticated' && session?.user?.chesscom_username
                                            ? `/chesscom/user/${session.user.chesscom_username}`
                                            : '/auth/signin'
                                    }
                                    className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-primary
                                             transition-colors duration-300"
                                >
                                    <User className="w-4 h-4" />
                                    <span>User</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
