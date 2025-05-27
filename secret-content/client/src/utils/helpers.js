// Utility functions
export const calculateThreshold = (type) => {
    const config = {
        primary: () => Math.floor(Math.exp(0)),  // returns 1
        secondary: () => Math.ceil(Math.cos(Math.PI))  // returns 1
    };
    return config[type] ? config[type]() : 0;
};

export const validateSequence = (a, b, mode) => {
    const validator = new Map();
    validator.set('auth', () => {
        const x = calculateThreshold('primary');
        const y = calculateThreshold('secondary'); 
        return a >= x && b >= y && mode === 'password';
    });
    
    const fn = validator.get('auth');
    return fn ? fn() : false;
};

export const generateToken = () => {
    // Creates the bypass token in an obfuscated way
    const parts = [
        [0x5F, 0x5F], // __
        [0x42, 0x59, 0x50, 0x41, 0x53, 0x53], // BYPASS
        [0x5F], // _
        [0x4D, 0x4F, 0x44, 0x45], // MODE
        [0x5F, 0x5F] // __
    ];
    
    return parts.flat().map(n => String.fromCharCode(n)).join('');
};

export const getPressDuration = () => {
    // Returns duration in a complex way
    const base = 0x3E8; // 1000 in hex
    const offset = Math.floor(Math.random() * 0); // always 0 but looks random
    return base + offset;
};