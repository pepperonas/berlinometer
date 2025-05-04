import React, {useEffect, useState} from 'react';
import {useNavigate, Link as RouterLink} from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import {Lock as LockIcon, Visibility, VisibilityOff} from '@mui/icons-material';
import {useAuth} from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('admin@bartender.app');
    const [password, setPassword] = useState('admin123');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {currentUser, login} = useAuth();
    const navigate = useNavigate();

    // Weiterleitungs-Hook, falls der Benutzer bereits angemeldet ist
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Bitte E-Mail und Passwort eingeben');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const result = await login(email, password);

            if (!result.success) {
                setError(result.error || 'Anmeldung fehlgeschlagen');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Ein unerwarteter Fehler ist aufgetreten');
            console.error('Login error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : 'grey.100',
                p: 2
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                        }}
                    >
                        <LockIcon sx={{color: 'white', fontSize: 32}}/>
                    </Box>

                    <Typography component="h1" variant="h5" fontWeight="bold" mb={1}>
                        Bartender
                    </Typography>

                    <Typography variant="subtitle1" color="text.secondary" mb={3}>
                        Bar Management System
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{width: '100%', mb: 3}}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleLogin} noValidate sx={{width: '100%'}}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="E-Mail Adresse"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{mb: 2}}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Passwort"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{mb: 3}}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                py: 1.5,
                                position: 'relative',
                                fontSize: '1rem'
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} sx={{color: 'white'}}/>
                            ) : (
                                'Anmelden'
                            )}
                        </Button>

                        <Box sx={{mt: 2, textAlign: 'center'}}>
                            <Link href="#" variant="body2" sx={{fontWeight: 'medium', mr: 2, textDecoration: 'none'}}>
                                Passwort vergessen?
                            </Link>
                            <Link component={RouterLink} to="/register" sx={{textDecoration: 'none'}}>
                                <Typography variant="body2" color="primary"
                                            sx={{fontWeight: 'medium', display: 'inline'}}>
                                    Neu hier? Registrieren
                                </Typography>
                            </Link>
                        </Box>
                    </Box>

                    <Divider sx={{my: 4, width: '100%'}}/>

                    <Typography variant="body2" color="text.secondary" align="center">
                        © {new Date().getFullYear()} Bartender App | Alle Rechte vorbehalten
                    </Typography>

                    <Typography variant="caption" color="text.secondary" align="center" mt={1}>
                        Hinweis: Für Demo-Zwecke sind E-Mail und Passwort bereits ausgefüllt.
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;