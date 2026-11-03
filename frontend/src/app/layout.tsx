import type { Metadata } from 'next';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/ui';

export const metadata: Metadata = {
    title: 'DevDrive - Secure Cloud Storage & File Management',
    description: 'Cloud storage with role-based access control, OAuth, and subscription tiers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    return (
        <html lang="en">
            <body className="min-h-screen bg-canvas text-fg antialiased">
                <GoogleOAuthProvider clientId={googleClientId}>
                    <AuthProvider>
                        <ToastProvider>
                            <Navbar />
                            <main id="main">{children}</main>
                        </ToastProvider>
                    </AuthProvider>
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
