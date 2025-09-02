import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Anmelden - ZauberKoch',
  description: 'Melde dich bei ZauberKoch an und entdecke personalisierte Rezepte mit künstlicher Intelligenz.',
};

export default function LoginPage() {
  return <LoginForm />;
}