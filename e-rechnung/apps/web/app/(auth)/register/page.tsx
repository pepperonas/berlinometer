'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Eye, EyeOff, Building, Mail, Lock, User, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const registerSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen haben'),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen haben'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten'),
  confirmPassword: z.string(),
  
  // Company Information
  companyName: z.string().min(2, 'Firmenname ist erforderlich'),
  tenantSlug: z.string()
    .min(3, 'Mandanten-ID muss mindestens 3 Zeichen haben')
    .max(30, 'Mandanten-ID darf maximal 30 Zeichen haben')
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt'),
  industry: z.string().min(1, 'Bitte wählen Sie eine Branche'),
  
  // Address
  street: z.string().min(3, 'Straße ist erforderlich'),
  zipCode: z.string().min(5, 'PLZ ist erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  
  // Legal
  acceptTerms: z.boolean().refine(val => val, 'Sie müssen den AGB zustimmen'),
  acceptPrivacy: z.boolean().refine(val => val, 'Sie müssen der Datenschutzerklärung zustimmen'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const industries = [
  { value: 'HANDWERK', label: 'Handwerk' },
  { value: 'GASTRO', label: 'Gastronomie' },
  { value: 'EINZELHANDEL', label: 'Einzelhandel' },
  { value: 'DIENSTLEISTUNG', label: 'Dienstleistung' },
  { value: 'BERATUNG', label: 'Beratung' },
  { value: 'IT', label: 'IT & Software' },
  { value: 'GESUNDHEIT', label: 'Gesundheitswesen' },
  { value: 'OTHER', label: 'Sonstige' },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const companyName = watch('companyName')

  // Auto-generate tenant slug from company name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Registrierung fehlgeschlagen')
      }

      toast.success('Registrierung erfolgreich!', {
        description: 'Sie können sich nun anmelden.',
      })
      
      router.push('/login?message=registration-success')
    } catch (error) {
      toast.error('Registrierung fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">H</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">HandwerkOS-Konto erstellen</CardTitle>
            <CardDescription>
              Starten Sie Ihr kostenloses ERP-System in wenigen Minuten
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Persönliche Daten
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname *</Label>
                    <Input
                      id="firstName"
                      placeholder="Max"
                      {...register('firstName')}
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname *</Label>
                    <Input
                      id="lastName"
                      placeholder="Mustermann"
                      {...register('lastName')}
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="max@musterfirma.de"
                      className="pl-10"
                      {...register('email')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sicheres Passwort"
                        className="pl-10 pr-10"
                        {...register('password')}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Passwort wiederholen"
                        className="pl-10 pr-10"
                        {...register('confirmPassword')}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Firmendaten
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input
                    id="companyName"
                    placeholder="Musterfirma GmbH"
                    {...register('companyName')}
                    onChange={(e) => {
                      register('companyName').onChange(e)
                      setValue('tenantSlug', generateSlug(e.target.value))
                    }}
                    disabled={isLoading}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantSlug">Ihre HandwerkOS-URL *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">app.handwerkos.de/</span>
                    <Input
                      id="tenantSlug"
                      placeholder="musterfirma"
                      {...register('tenantSlug')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.tenantSlug && (
                    <p className="text-sm text-destructive">{errors.tenantSlug.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Nur Kleinbuchstaben, Zahlen und Bindestriche. Dies wird Ihre eindeutige URL.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Branche *</Label>
                  <Select onValueChange={(value) => setValue('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie Ihre Branche" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-destructive">{errors.industry.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Firmenadresse
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="street">Straße und Hausnummer *</Label>
                  <Input
                    id="street"
                    placeholder="Musterstraße 123"
                    {...register('street')}
                    disabled={isLoading}
                  />
                  {errors.street && (
                    <p className="text-sm text-destructive">{errors.street.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">PLZ *</Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      {...register('zipCode')}
                      disabled={isLoading}
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt *</Label>
                    <Input
                      id="city"
                      placeholder="Musterstadt"
                      {...register('city')}
                      disabled={isLoading}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    {...register('acceptTerms')}
                    disabled={isLoading}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="acceptTerms" className="text-sm">
                      Ich akzeptiere die{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        Allgemeinen Geschäftsbedingungen
                      </Link>
                      *
                    </Label>
                  </div>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                )}
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptPrivacy"
                    {...register('acceptPrivacy')}
                    disabled={isLoading}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="acceptPrivacy" className="text-sm">
                      Ich habe die{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Datenschutzerklärung
                      </Link>{' '}
                      gelesen und stimme zu *
                    </Label>
                  </div>
                </div>
                {errors.acceptPrivacy && (
                  <p className="text-sm text-destructive">{errors.acceptPrivacy.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Konto wird erstellt...
                  </>
                ) : (
                  'HandwerkOS-Konto erstellen'
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Bereits ein Konto?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Hier anmelden
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}