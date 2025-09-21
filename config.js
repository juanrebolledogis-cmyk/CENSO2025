// Configuración para GitHub Pages - Sistema de Censo
window.ENV_CONFIG = {
    // ===========================================
    // CONFIGURACIÓN DE PROXIES
    // ===========================================
    
    // Configuración de proxies (Google Apps Script)
    PROXY_URL: 'https://script.google.com/macros/s/AKfycbzUlxR9WFpsxWleMGfRdVNbWgnLjwvalcW3abUzP8L5aDPfWUf1hTEG-FUZFR88drlZEg/exec',
    PROXY_URLS: 'https://script.google.com/macros/s/AKfycbzUlxR9WFpsxWleMGfRdVNbWgnLjwvalcW3abUzP8L5aDPfWUf1hTEG-FUZFR88drlZEg/exec,https://script.google.com/macros/s/AKfycbx6GjhX5FyKtHnCbwGZyarjrJm76Yq-LIh5bLp5JrjmUIN-9-a2BmGyaeIR1ig-e4B2Ig/exec,https://script.google.com/macros/s/AKfycbwIRK25Jv0L0EFRc-bb5NoRoUU5KaDGJiZ_qhRu-0EmK-QCLlCpd_ptailDVirAc01Bcg/exec,https://script.google.com/macros/s/AKfycby71-4AOWKR3RPMncLd7YJj24cfhm6u-J2r_EBh6PF--dOhGrB9cTxsEhgVORqK_ynvEg/exec,https://script.google.com/macros/s/AKfycbyZ3hPcI6L_aYuMsU53tB8Pm0ka6EwW6AZQJ_-qXzuahGiRVIqRd0oNP-SFYq9Zl-19uA/exec',
    
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
    CEDULA_NOT_FOUND_URL: 'https://www.youtube.com/watch?v=uEZY7mCfAME&list=PL3jRzVbehrgq-VI620DwdVzxBBO5h6hgz&index=2',
    CODIGO_NOT_FOUND_URL: 'https://www.youtube.com/watch?v=uEZY7mCfAME&list=PL3jRzVbehrgq-VI620DwdVzxBBO5h6hgz&index=2',
    
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


