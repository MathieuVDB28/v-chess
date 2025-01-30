'use client'
import { useRouter } from 'next/navigation'
import { Trekking } from 'iconoir-react'

export default function WorkInProgress() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
            <div className="text-center max-w-2xl">
                <Trekking className="w-24 h-24 text-primary mx-auto mb-8" />
                
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    Work in Progress
                </h1>
                
                <p className="text-lg text-foreground/80 mb-8">
                    This page is currently under construction. We&apos;re working hard to bring you something amazing!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-background border border-primary text-primary rounded-lg hover:bg-primary hover:text-background transition-colors"
                    >
                        Go Back
                    </button>
                    
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-primary text-background rounded-lg hover:bg-background hover:border hover:border-primary hover:text-primary transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    )
}