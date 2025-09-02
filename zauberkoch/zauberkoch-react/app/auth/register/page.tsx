import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrieren - ZauberKoch',
  description: 'Erstelle ein kostenloses ZauberKoch-Konto und entdecke personalisierte Rezepte mit künstlicher Intelligenz.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}