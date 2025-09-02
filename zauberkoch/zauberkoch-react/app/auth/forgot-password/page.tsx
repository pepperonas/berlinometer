import { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Passwort vergessen - ZauberKoch',
  description: 'Setze dein ZauberKoch-Passwort zurück und erhalte wieder Zugang zu deinen personalisierten Rezepten.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}