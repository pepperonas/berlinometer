import React, { useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Mic, Stop, Send } from '@mui/icons-material';
import RecordRTC from 'recordrtc';

const VoiceRecorder = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
      });
      
      recorderRef.current.startRecording();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Fehler beim Starten der Aufnahme:', err);
    }
  };

  const stopRecording = () => {
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      setAudioBlob(blob);
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingTime(0);
    });
  };

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      setAudioBlob(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      {isRecording && (
        <Typography variant="h4" sx={{ mb: 2, color: 'error.main' }}>
          {formatTime(recordingTime)}
        </Typography>
      )}
      
      {!isRecording && !audioBlob && (
        <Button
          variant="contained"
          size="large"
          startIcon={<Mic />}
          onClick={startRecording}
          sx={{ 
            borderRadius: '50px',
            px: 4,
            py: 2,
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
          }}
        >
          Aufnahme starten
        </Button>
      )}
      
      {isRecording && (
        <Button
          variant="contained"
          size="large"
          startIcon={<Stop />}
          onClick={stopRecording}
          color="error"
          sx={{ borderRadius: '50px', px: 4, py: 2 }}
        >
          Aufnahme stoppen
        </Button>
      )}
      
      {audioBlob && (
        <Box sx={{ mt: 3 }}>
          <audio controls src={URL.createObjectURL(audioBlob)} />
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={submitRecording}
              sx={{ mr: 2 }}
            >
              Bericht erstellen
            </Button>
            <Button
              variant="outlined"
              onClick={() => setAudioBlob(null)}
            >
              Verwerfen
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VoiceRecorder;
