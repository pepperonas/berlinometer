import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import api from '../services/api';

const TimeContainer = styled.div`
    background-color: ${({theme}) => theme.colors.backgroundDarker};
    padding: ${({theme}) => theme.spacing.md};
    border-radius: ${({theme}) => theme.borderRadius.md};
    margin-bottom: ${({theme}) => theme.spacing.lg};
`;

const TimeInfo = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${({theme}) => theme.spacing.sm};

    &:last-child {
        margin-bottom: 0;
    }
`;

const Label = styled.span`
    color: ${({theme}) => theme.colors.textSecondary};
`;

const Value = styled.span`
    color: ${({theme}) => theme.colors.textPrimary};
    font-family: monospace;
`;

const ServerTimeInfo = () => {
    const [serverTime, setServerTime] = useState(null);
    const [localTime, setLocalTime] = useState(Math.floor(Date.now() / 1000));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchServerTime = async () => {
            try {
                const response = await api.get('/tokens/servertime');
                setServerTime(response.data.data);
                setLocalTime(Math.floor(Date.now() / 1000));
                setLoading(false);
            } catch (err) {
                console.error('Fehler beim Abrufen der Serverzeit:', err);
                setError('Serverzeit konnte nicht abgerufen werden');
                setLoading(false);
            }
        };

        // Initial und dann alle 10 Sekunden die Serverzeit abrufen
        fetchServerTime();
        const serverTimeInterval = setInterval(fetchServerTime, 10000);

        return () => clearInterval(serverTimeInterval);
    }, []);

    // Lokale Zeit aktualisieren
    useEffect(() => {
        const timer = setInterval(() => {
            setLocalTime(Math.floor(Date.now() / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return <TimeContainer>Serverzeit wird geladen...</TimeContainer>;
    }

    if (error) {
        return <TimeContainer>{error}</TimeContainer>;
    }

    const timeDifference = serverTime ? localTime - serverTime.serverTime : 0;

    return (
        <TimeContainer>
            <h4>Zeit-Synchronisation</h4>
            <TimeInfo>
                <Label>Lokale Zeit:</Label>
                <Value>{new Date(localTime * 1000).toLocaleString()}</Value>
            </TimeInfo>
            <TimeInfo>
                <Label>Server-Zeit:</Label>
                <Value>{new Date(serverTime.serverTime * 1000).toLocaleString()}</Value>
            </TimeInfo>
            <TimeInfo>
                <Label>Zeitunterschied:</Label>
                <Value>{timeDifference} Sekunden</Value>
            </TimeInfo>
            <TimeInfo>
                <Label>TOTP Periode:</Label>
                <Value>30 Sekunden</Value>
            </TimeInfo>
            <TimeInfo>
                <Label>Status:</Label>
                <Value style={{color: Math.abs(timeDifference) > 30 ? '#e16162' : '#9cb68f'}}>
                    {Math.abs(timeDifference) > 30 ? 'Nicht synchronisiert!' : 'Synchronisiert'}
                </Value>
            </TimeInfo>
        </TimeContainer>
    );
};

export default ServerTimeInfo;