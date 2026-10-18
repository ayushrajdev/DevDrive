import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'DevDrive — Secure Cloud Storage & File Management',
    description: 'Enterprise-grade cloud storage with role-based access control, OAuth, and subscription tiers.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const googleClientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        '49496056122-gtvbtjankhnq56ei05dmv01v7nsgjvvq.apps.googleusercontent.com';

    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}
            >
                <GoogleOAuthProvider clientId={googleClientId}>
                    <AuthProvider>
                        <Navbar />
                        <main>{children}</main>
                    </AuthProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
