// Configuración para GitHub Pages - Sistema de Censo
window.ENV_CONFIG = {
    // ===========================================
    // CONFIGURACIÓN DE PROXIES
    // ===========================================
    
    // Configuración de proxies (Google Apps Script)
    PROXY_URL: 'https://script.google.com/macros/s/AKfycbyXJrUQ5RUh34OERK7KZFNLOlQcQjiJvv2gkmcc7ECJeJbM2cUDOVOnry8uwfClcIeY/exec',
    PROXY_URLS: 'https://script.google.com/macros/s/AKfycbyXJrUQ5RUh34OERK7KZFNLOlQcQjiJvv2gkmcc7ECJeJbM2cUDOVOnry8uwfClcIeY/exec,https://script.google.com/macros/s/AKfycbzCmC1detkqVts4YHv9oI4Wklty507vuHvZ33rMa8B2Lkt79lKkQ813rtpU-EocYN6X/exec,https://script.google.com/macros/s/AKfycbxiVpDQno7ed92-IMCxVSDiSuM0x1l8QsrW5gC6q2Yi0jU5X9TOdeC6Iim8R1vzvPIe/exec',
    
    // ===========================================
    // CONFIGURACIÓN DE COLUMNAS
    // ===========================================
    
    // Nombres de las columnas en tu hoja
    CEDULA_COLUMN: 'Numero de documento',
    CODIGO_COLUMN: 'N de registro',
    
    // ===========================================
    // CONFIGURACIÓN DE MENSAJES
    // ===========================================
    
    // Mensajes personalizables del sistema
    CEDULA_FOUND_MESSAGE: 'Ya fuiste censado con esta cédula.',
    CODIGO_FOUND_MESSAGE: 'Ya fuiste censado con este código.',
    CEDULA_NOT_FOUND_MESSAGE: 'No fuiste censado aún. Te redirigiremos al formulario.',
    CODIGO_NOT_FOUND_MESSAGE: 'No fuiste censado aún. Te redirigiremos al formulario.',
    ERROR_SEARCH_MESSAGE: 'Error al realizar la búsqueda. Intenta nuevamente.',
    INVALID_INPUT_MESSAGE: 'Por favor ingresa un valor válido.',
    LOADING_MESSAGE: 'Buscando en la base de datos...',
    
    // ===========================================
    // CONFIGURACIÓN DE REDIRECCIÓN
    // ===========================================
    
    // URLs de redirección cuando no se encuentra la persona
    CEDULA_NOT_FOUND_URL: 'https://www.youtube.com/watch?v=mABmOBBFEAo',
    CODIGO_NOT_FOUND_URL: 'https://x.com',
    
    // ===========================================
    // CONFIGURACIÓN DE VALIDACIÓN
    // ===========================================
    
    // Límites de validación para los campos
    CEDULA_MIN_LENGTH: 7,
    CEDULA_MAX_LENGTH: 12,
    CODIGO_MIN_LENGTH: 4,
    CODIGO_MAX_LENGTH: 20,
    
    // ===========================================
    // CONFIGURACIÓN DE DISEÑO (OPCIONAL)
    // ===========================================
    
    // Colores personalizables (en formato hexadecimal)
    PRIMARY_COLOR: '#2563eb',
    SUCCESS_COLOR: '#10b981',
    ERROR_COLOR: '#ef4444',
    WARNING_COLOR: '#f59e0b',
    BACKGROUND_COLOR: '#f8fafc',
    CARD_BACKGROUND: '#ffffff',
    TEXT_PRIMARY: '#1f2937',
    TEXT_SECONDARY: '#6b7280'
};
