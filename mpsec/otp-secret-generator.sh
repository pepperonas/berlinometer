#!/bin/bash
# OTP Client Secret Generator
# Generiert ein zufälliges Secret für OTP-Implementierungen

# Funktion für Base32-Codierung
base32_encode() {
    local input="$1"
    local alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    local result=""
    local bits=0
    local value=0
    
    for (( i=0; i<${#input}; i++ )); do
        value=$(( (value << 8) | $(printf "%d" "'${input:$i:1}") ))
        bits=$((bits + 8))
        
        while [ $bits -ge 5 ]; do
            bits=$((bits - 5))
            idx=$((value >> bits & 0x1F))
            result="${result}${alphabet:$idx:1}"
        done
    done
    
    if [ $bits -gt 0 ]; then
        idx=$((value << (5 - bits) & 0x1F))
        result="${result}${alphabet:$idx:1}"
    fi
    
    echo "$result"
}

# Generiere zufällige Bytes (16 Bytes = 128 Bits, übliche Größe für OTP Secrets)
random_bytes=$(dd if=/dev/urandom bs=16 count=1 2>/dev/null)

# Base32-Kodierung des Secrets
secret=$(base32_encode "$random_bytes")

# Ausgabe formatieren (Gruppen von 4 Zeichen für bessere Lesbarkeit)
formatted_secret=$(echo $secret | sed 's/.\{4\}/& /g')

echo "Dein OTP Secret wurde generiert:"
echo "$secret"
echo "$formatted_secret"
echo
echo "Du kannst dieses Secret in deiner OTP-App (wie Google Authenticator, Authy, etc.) verwenden."
echo "Für QR-Code-Generierung kannst du ein Tool wie 'qrencode' installieren und verwenden."
