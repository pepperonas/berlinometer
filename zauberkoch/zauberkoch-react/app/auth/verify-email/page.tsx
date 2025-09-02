import { Metadata } from 'next';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';

export const metadata: Metadata = {
  title: 'E-Mail verifizieren - ZauberKoch',
  description: 'Verifiziere deine E-Mail-Adresse, um alle ZauberKoch-Features nutzen zu können.',
};

export default function VerifyEmailPage() {
  return <EmailVerificationForm />;
}