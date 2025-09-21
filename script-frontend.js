// Sistema de caché inteligente con búsqueda optimizada para Google Sheets API
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 2 * 60 * 1000; // 2 minutos (reducido para datos más frescos)
        this.lastUpdate = 0;
        this.hits = 0;
        this.misses = 0;
        this.lastRowCount = 0;
        this.forceRefresh = false;
        
        // Índices de búsqueda optimizada
        this.searchIndex = new Map();
        this.columnIndexes = new Map();
        this.indexBuilt = false;
        
        // Caché de resultados de búsqueda específicos
        this.searchResultsCache = new Map();
        this.searchResultsExpiry = 5 * 60 * 1000; // 5 minutos para resultados de búsqueda
        this.searchHits = 0;
        this.searchMisses = 0;
    }

  isCacheValid() {
    return Date.now() - this.lastUpdate < this.cacheExpiry && !this.forceRefresh;
  }

  getCachedData() {
    if (this.isCacheValid()) {
      this.hits++;
      return this.cache.get('sheetData');
    }
    this.misses++;
    return null;
  }

  setCachedData(data) {
    this.cache.set('sheetData', data);
    this.lastUpdate = Date.now();
    this.forceRefresh = false;
    
    // Verificar si el número de filas cambió
    const currentRowCount = data ? data.length : 0;
    if (this.lastRowCount > 0 && currentRowCount !== this.lastRowCount) {
      // Si cambió el número de filas, forzar actualización en la próxima búsqueda
      this.forceRefresh = true;
    }
    this.lastRowCount = currentRowCount;
    
    // Reconstruir índices de búsqueda
    this.buildSearchIndex(data);
  }

  // Construir índices de búsqueda optimizada
  buildSearchIndex(values) {
    if (!values || values.length <= 1) {
      this.searchIndex.clear();
      this.columnIndexes.clear();
      this.indexBuilt = false;
      return;
    }

    this.searchIndex.clear();
    this.columnIndexes.clear();
    
    const headers = values[0];
    
    // Encontrar índices de columnas
    const cedulaCol = headers.findIndex(h => 
      h.toString().toLowerCase().includes('documento') || 
      h.toString().toLowerCase().includes('cedula')
    );
    const codigoCol = headers.findIndex(h => 
      h.toString().toLowerCase().includes('registro') || 
      h.toString().toLowerCase().includes('codigo')
    );
    
    // Crear índice para cédula/documento
    if (cedulaCol !== -1) {
      this.columnIndexes.set('cedula', cedulaCol);
      this.searchIndex.set('cedula', new Map());
      
      for (let i = 1; i < values.length; i++) {
        const value = values[i][cedulaCol];
        if (value) {
          const cleanValue = value.toString().trim();
          this.searchIndex.get('cedula').set(cleanValue, i);
        }
      }
    }
    
    // Crear índice para código/registro
    if (codigoCol !== -1) {
      this.columnIndexes.set('codigo', codigoCol);
      this.searchIndex.set('codigo', new Map());
      
      for (let i = 1; i < values.length; i++) {
        const value = values[i][codigoCol];
        if (value) {
          const cleanValue = value.toString().trim();
          this.searchIndex.get('codigo').set(cleanValue, i);
        }
      }
    }
    
    this.indexBuilt = true;
  }

  // Búsqueda optimizada O(1) en lugar de O(n)
  fastSearch(searchType, searchValue) {
    if (!this.indexBuilt) {
      return null;
    }
    
    const index = this.searchIndex.get(searchType);
    if (!index) {
      return null;
    }
    
    const cleanSearchValue = searchValue.toString().trim();
    const rowIndex = index.get(cleanSearchValue);
    
    if (rowIndex !== undefined) {
      this.hits++;
      return {
        found: true,
        rowIndex: rowIndex,
        rowNumber: rowIndex + 1 // +1 porque las filas empiezan en 1
      };
    }
    
    this.misses++;
    return {
      found: false,
      rowIndex: -1,
      rowNumber: -1
    };
  }

  clearCache() {
    this.cache.clear();
    this.searchIndex.clear();
    this.columnIndexes.clear();
    this.lastUpdate = 0;
    this.lastRowCount = 0;
    this.forceRefresh = false;
    this.indexBuilt = false;
  }

  // Forzar actualización del caché
  forceUpdate() {
    this.forceRefresh = true;
  }

  // Verificar si necesita actualización basada en tiempo
  needsUpdate() {
    return Date.now() - this.lastUpdate > this.cacheExpiry || this.forceRefresh;
  }

    // Caché de resultados de búsqueda específicos
    getSearchResult(searchType, searchValue) {
        const key = `${searchType}:${searchValue}`;
        const cached = this.searchResultsCache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.searchResultsExpiry) {
            this.searchHits++;
            return cached.data;
        }
        
        this.searchMisses++;
        return null;
    }
    
    setSearchResult(searchType, searchValue, result) {
        const key = `${searchType}:${searchValue}`;
        this.searchResultsCache.set(key, {
            data: result,
            timestamp: Date.now()
        });
        
        // Limpiar caché si tiene más de 1000 entradas
        if (this.searchResultsCache.size > 1000) {
            this.cleanOldSearchResults();
        }
        
    }
    
    cleanOldSearchResults() {
        const now = Date.now();
        for (const [key, value] of this.searchResultsCache.entries()) {
            if (now - value.timestamp > this.searchResultsExpiry) {
                this.searchResultsCache.delete(key);
            }
        }
        console.log(`🧹 [CACHÉ] Limpieza de resultados antiguos completada`);
    }
    
    clearSearchResultsCache() {
        this.searchResultsCache.clear();
        this.searchHits = 0;
        this.searchMisses = 0;
        console.log(`🗑️ [CACHÉ] Caché de resultados limpiado`);
    }

    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? Math.round((this.hits / total) * 100) : 0;
        
        const searchTotal = this.searchHits + this.searchMisses;
        const searchHitRate = searchTotal > 0 ? Math.round((this.searchHits / searchTotal) * 100) : 0;
        
        return {
            // Estadísticas del caché de datos
            hits: this.hits,
            misses: this.misses,
            hitRate: hitRate,
            cacheAge: Math.round((Date.now() - this.lastUpdate) / 1000),
            lastRowCount: this.lastRowCount,
            forceRefresh: this.forceRefresh,
            indexBuilt: this.indexBuilt,
            indexedColumns: Array.from(this.columnIndexes.keys()),
            
            // Estadísticas del caché de resultados de búsqueda
            searchHits: this.searchHits,
            searchMisses: this.searchMisses,
            searchHitRate: searchHitRate,
            searchResultsCount: this.searchResultsCache.size
        };
    }
}

// Instancia global del caché
const cacheManager = new CacheManager();

// Balanceador de carga para múltiples proxies
class LoadBalancer {
    constructor() {
        this.proxyUrls = [];
        this.currentIndex = 0;
        this.failedProxies = new Set();
        this.retryDelay = 30000; // 30 segundos
        this.lastRetry = new Map();
    }

    // Configurar URLs de proxies
    setProxyUrls(urls) {
        this.proxyUrls = urls;
        this.currentIndex = 0;
        this.failedProxies.clear();
        this.lastRetry.clear();
    }

    // Obtener el siguiente proxy disponible
    getNextProxy() {
        if (this.proxyUrls.length === 0) {
            throw new Error('No hay proxies configurados');
        }

        // Si solo hay un proxy, usarlo siempre
        if (this.proxyUrls.length === 1) {
            return this.proxyUrls[0];
        }

        // Buscar un proxy disponible
        let attempts = 0;
        while (attempts < this.proxyUrls.length) {
            const proxyUrl = this.proxyUrls[this.currentIndex];
            
            // Verificar si el proxy está marcado como fallido
            if (!this.failedProxies.has(proxyUrl)) {
                this.currentIndex = (this.currentIndex + 1) % this.proxyUrls.length;
                return proxyUrl;
            }

            // Verificar si es hora de reintentar este proxy
            const lastRetryTime = this.lastRetry.get(proxyUrl) || 0;
            if (Date.now() - lastRetryTime > this.retryDelay) {
                this.failedProxies.delete(proxyUrl);
                this.currentIndex = (this.currentIndex + 1) % this.proxyUrls.length;
                return proxyUrl;
            }

            this.currentIndex = (this.currentIndex + 1) % this.proxyUrls.length;
            attempts++;
        }

        // Si todos los proxies están fallidos, usar el primero
        return this.proxyUrls[0];
    }

    // Marcar un proxy como fallido
    markProxyFailed(proxyUrl) {
        this.failedProxies.add(proxyUrl);
        this.lastRetry.set(proxyUrl, Date.now());
    }

    // Obtener estadísticas del balanceador
    getStats() {
        return {
            totalProxies: this.proxyUrls.length,
            failedProxies: this.failedProxies.size,
            availableProxies: this.proxyUrls.length - this.failedProxies.size,
            currentIndex: this.currentIndex,
            failedProxyUrls: Array.from(this.failedProxies)
        };
    }

    // Resetear todos los proxies fallidos
    resetFailedProxies() {
        this.failedProxies.clear();
        this.lastRetry.clear();
    }
}

// Instancia global del balanceador
const loadBalancer = new LoadBalancer();

// Sistema de carga de variables de entorno para el frontend
class EnvironmentLoader {
  constructor() {
    this.config = {};
    this.loaded = false;
  }

    // Cargar variables de entorno desde un archivo .env
    async loadEnvironmentVariables() {
        try {
    // Cargar variables desde el archivo .env (deshabilitado - usando solo config.js)
    // await this.loadFromEnvFile();
            
            // Configuración base con valores por defecto
            this.config = {
                // Google Sheets API Configuration (usando múltiples proxies)
                PROXY_URLS: this.parseProxyUrls(this.getEnvValue('PROXY_URLS', 'TU_URL_PROXY_AQUI')),
        
        // Nombres de las columnas en la hoja de Google Sheets
        COLUMNS: {
          CEDULA: this.getEnvValue('CEDULA_COLUMN', 'Numero de documento'),
          CODIGO: this.getEnvValue('CODIGO_COLUMN', 'N de registro')
        },
        
        // URLs de redirección
        REDIRECT_URLS: {
          CEDULA_NOT_FOUND: this.getEnvValue('CEDULA_NOT_FOUND_URL', 'google.com'),
          CODIGO_NOT_FOUND: this.getEnvValue('CODIGO_NOT_FOUND_URL', 'google.com')
        },
        
        // Mensajes personalizables
        MESSAGES: {
          CEDULA_FOUND: this.getEnvValue('CEDULA_FOUND_MESSAGE', 'Ya fuiste censado con este número de documento.'),
          CODIGO_FOUND: this.getEnvValue('CODIGO_FOUND_MESSAGE', 'Ya fuiste censado con este número de registro.'),
          CEDULA_NOT_FOUND: this.getEnvValue('CEDULA_NOT_FOUND_MESSAGE', 'No fuiste censado aún. Te redirigiremos al formulario.'),
          CODIGO_NOT_FOUND: this.getEnvValue('CODIGO_NOT_FOUND_MESSAGE', 'No fuiste censado aún. Te redirigiremos al formulario.'),
          ERROR_SEARCH: this.getEnvValue('ERROR_SEARCH_MESSAGE', 'Error al realizar la búsqueda. Intenta nuevamente.'),
          INVALID_INPUT: this.getEnvValue('INVALID_INPUT_MESSAGE', 'Por favor ingresa un valor válido.'),
          LOADING: this.getEnvValue('LOADING_MESSAGE', 'Buscando en la base de datos...')
        },
        
        // Configuración de validación
        VALIDATION: {
          CEDULA_MIN_LENGTH: parseInt(this.getEnvValue('CEDULA_MIN_LENGTH', '7')),
          CEDULA_MAX_LENGTH: parseInt(this.getEnvValue('CEDULA_MAX_LENGTH', '12')),
          CODIGO_MIN_LENGTH: parseInt(this.getEnvValue('CODIGO_MIN_LENGTH', '4')), // Mínimo 4 caracteres (RBAQ + al menos 1)
          CODIGO_MAX_LENGTH: parseInt(this.getEnvValue('CODIGO_MAX_LENGTH', '999')) // Sin límite máximo
        }
      };
        // Cargar configuración desde config.js (window.ENV_CONFIG)
        this.loadFromConfigJs();
        
        
        // Configurar el balanceador de carga con las URLs de proxies
        const proxyUrlsArray = Array.isArray(this.config.PROXY_URLS) 
            ? this.config.PROXY_URLS 
            : this.config.PROXY_URLS.split(',').map(url => url.trim()).filter(url => url.length > 0);
        loadBalancer.setProxyUrls(proxyUrlsArray);
        

        
        this.loaded = true;
        
        // Log final de configuración
        console.log('🎯 [CONFIG] Configuración cargada correctamente');
        
        return this.config;
      
    } catch (error) {
      console.error('Error cargando variables de entorno');
      throw error;
    }
  }

  // Obtener valor de variable de entorno (deshabilitado - usando solo config.js)
  getEnvValue(key, defaultValue = null) {
    return defaultValue;
  }

      // Parsear URLs de proxies (deshabilitado - usando solo config.js)
      parseProxyUrls(proxyUrlsString) {
        if (!proxyUrlsString || proxyUrlsString === 'TU_URL_PROXY_AQUI') {
          return ['TU_URL_PROXY_AQUI'];
        }
        
        // Dividir por comas y limpiar espacios
        const urls = proxyUrlsString.split(',').map(url => url.trim()).filter(url => url.length > 0);
        
        if (urls.length === 0) {
          return ['TU_URL_PROXY_AQUI'];
        }
        
        return urls;
      }

  // Cargar configuración desde config.js (window.ENV_CONFIG)
  loadFromConfigJs() {
    console.log('🔍 [DEBUG] Verificando configuración...');
    
    if (typeof window !== 'undefined' && window.ENV_CONFIG) {
      console.log('🔧 [CONFIG] Cargando configuración desde config.js');
      
      // Aplicar configuración de window.ENV_CONFIG
      if (window.ENV_CONFIG.PROXY_URLS) {
        console.log('🔧 [CONFIG] Aplicando PROXY_URLS');
        this.config.PROXY_URLS = window.ENV_CONFIG.PROXY_URLS;
      }
      if (window.ENV_CONFIG.COLUMNS) {
        console.log('🔧 [CONFIG] Aplicando COLUMNS');
        this.config.COLUMNS = { ...this.config.COLUMNS, ...window.ENV_CONFIG.COLUMNS };
      }
      if (window.ENV_CONFIG.REDIRECT_URLS) {
        console.log('🔧 [CONFIG] Aplicando REDIRECT_URLS');
        this.config.REDIRECT_URLS = { ...this.config.REDIRECT_URLS, ...window.ENV_CONFIG.REDIRECT_URLS };
      }
      if (window.ENV_CONFIG.MESSAGES) {
        console.log('🔧 [CONFIG] Aplicando MESSAGES');
        this.config.MESSAGES = { ...this.config.MESSAGES, ...window.ENV_CONFIG.MESSAGES };
      }
      if (window.ENV_CONFIG.VALIDATION) {
        console.log('🔧 [CONFIG] Aplicando VALIDATION');
        this.config.VALIDATION = { ...this.config.VALIDATION, ...window.ENV_CONFIG.VALIDATION };
      }
      
      // Aplicar variables individuales de config.js
      if (window.ENV_CONFIG.PROXY_URL) {
        console.log('🔧 [CONFIG] Aplicando PROXY_URL');
        this.config.PROXY_URL = window.ENV_CONFIG.PROXY_URL;
      }
      
      if (window.ENV_CONFIG.CEDULA_COLUMN) {
        console.log('🔧 [CONFIG] Aplicando CEDULA_COLUMN');
        this.config.COLUMNS.CEDULA = window.ENV_CONFIG.CEDULA_COLUMN;
      }
      
      if (window.ENV_CONFIG.CODIGO_COLUMN) {
        console.log('🔧 [CONFIG] Aplicando CODIGO_COLUMN');
        this.config.COLUMNS.CODIGO = window.ENV_CONFIG.CODIGO_COLUMN;
      }
      
      if (window.ENV_CONFIG.CEDULA_FOUND_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando CEDULA_FOUND_MESSAGE');
        this.config.MESSAGES.CEDULA_FOUND = window.ENV_CONFIG.CEDULA_FOUND_MESSAGE;
      }
      
      if (window.ENV_CONFIG.CODIGO_FOUND_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando CODIGO_FOUND_MESSAGE');
        this.config.MESSAGES.CODIGO_FOUND = window.ENV_CONFIG.CODIGO_FOUND_MESSAGE;
      }
      
      if (window.ENV_CONFIG.CEDULA_NOT_FOUND_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando CEDULA_NOT_FOUND_MESSAGE');
        this.config.MESSAGES.CEDULA_NOT_FOUND = window.ENV_CONFIG.CEDULA_NOT_FOUND_MESSAGE;
      }
      
      if (window.ENV_CONFIG.CODIGO_NOT_FOUND_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando CODIGO_NOT_FOUND_MESSAGE');
        this.config.MESSAGES.CODIGO_NOT_FOUND = window.ENV_CONFIG.CODIGO_NOT_FOUND_MESSAGE;
      }
      
      if (window.ENV_CONFIG.ERROR_SEARCH_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando ERROR_SEARCH_MESSAGE');
        this.config.MESSAGES.ERROR_SEARCH = window.ENV_CONFIG.ERROR_SEARCH_MESSAGE;
      }
      
      if (window.ENV_CONFIG.INVALID_INPUT_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando INVALID_INPUT_MESSAGE');
        this.config.MESSAGES.INVALID_INPUT = window.ENV_CONFIG.INVALID_INPUT_MESSAGE;
      }
      
      if (window.ENV_CONFIG.LOADING_MESSAGE) {
        console.log('🔧 [CONFIG] Aplicando LOADING_MESSAGE');
        this.config.MESSAGES.LOADING = window.ENV_CONFIG.LOADING_MESSAGE;
      }
      
      if (window.ENV_CONFIG.CEDULA_NOT_FOUND_URL) {
        console.log('🔧 [CONFIG] Aplicando CEDULA_NOT_FOUND_URL');
        this.config.REDIRECT_URLS.CEDULA_NOT_FOUND = window.ENV_CONFIG.CEDULA_NOT_FOUND_URL;
      }
      
      if (window.ENV_CONFIG.CODIGO_NOT_FOUND_URL) {
        console.log('🔧 [CONFIG] Aplicando CODIGO_NOT_FOUND_URL');
        this.config.REDIRECT_URLS.CODIGO_NOT_FOUND = window.ENV_CONFIG.CODIGO_NOT_FOUND_URL;
      }
      
      if (window.ENV_CONFIG.CEDULA_MIN_LENGTH) {
        console.log('🔧 [CONFIG] Aplicando CEDULA_MIN_LENGTH');
        this.config.VALIDATION.CEDULA_MIN_LENGTH = window.ENV_CONFIG.CEDULA_MIN_LENGTH;
      }
      
      if (window.ENV_CONFIG.CEDULA_MAX_LENGTH) {
        console.log('🔧 [CONFIG] Aplicando CEDULA_MAX_LENGTH');
        this.config.VALIDATION.CEDULA_MAX_LENGTH = window.ENV_CONFIG.CEDULA_MAX_LENGTH;
      }
      
      if (window.ENV_CONFIG.CODIGO_MIN_LENGTH) {
        console.log('🔧 [CONFIG] Aplicando CODIGO_MIN_LENGTH');
        this.config.VALIDATION.CODIGO_MIN_LENGTH = window.ENV_CONFIG.CODIGO_MIN_LENGTH;
      }
      
      if (window.ENV_CONFIG.CODIGO_MAX_LENGTH) {
        console.log('🔧 [CONFIG] Aplicando CODIGO_MAX_LENGTH');
        this.config.VALIDATION.CODIGO_MAX_LENGTH = window.ENV_CONFIG.CODIGO_MAX_LENGTH;
      }
      
      // Variables de diseño (opcionales)
      if (window.ENV_CONFIG.PRIMARY_COLOR) {
        console.log('🔧 [CONFIG] Aplicando PRIMARY_COLOR');
        this.config.PRIMARY_COLOR = window.ENV_CONFIG.PRIMARY_COLOR;
      }
      
      if (window.ENV_CONFIG.SUCCESS_COLOR) {
        console.log('🔧 [CONFIG] Aplicando SUCCESS_COLOR');
        this.config.SUCCESS_COLOR = window.ENV_CONFIG.SUCCESS_COLOR;
      }
      
      if (window.ENV_CONFIG.ERROR_COLOR) {
        console.log('🔧 [CONFIG] Aplicando ERROR_COLOR');
        this.config.ERROR_COLOR = window.ENV_CONFIG.ERROR_COLOR;
      }
      
      if (window.ENV_CONFIG.WARNING_COLOR) {
        console.log('🔧 [CONFIG] Aplicando WARNING_COLOR');
        this.config.WARNING_COLOR = window.ENV_CONFIG.WARNING_COLOR;
      }
      
      if (window.ENV_CONFIG.BACKGROUND_COLOR) {
        console.log('🔧 [CONFIG] Aplicando BACKGROUND_COLOR');
        this.config.BACKGROUND_COLOR = window.ENV_CONFIG.BACKGROUND_COLOR;
      }
      
      if (window.ENV_CONFIG.CARD_BACKGROUND) {
        console.log('🔧 [CONFIG] Aplicando CARD_BACKGROUND');
        this.config.CARD_BACKGROUND = window.ENV_CONFIG.CARD_BACKGROUND;
      }
      
      if (window.ENV_CONFIG.TEXT_PRIMARY) {
        console.log('🔧 [CONFIG] Aplicando TEXT_PRIMARY');
        this.config.TEXT_PRIMARY = window.ENV_CONFIG.TEXT_PRIMARY;
      }
      
      if (window.ENV_CONFIG.TEXT_SECONDARY) {
        console.log('🔧 [CONFIG] Aplicando TEXT_SECONDARY');
        this.config.TEXT_SECONDARY = window.ENV_CONFIG.TEXT_SECONDARY;
      }
      console.log('🔧 [CONFIG] Configuración aplicada desde window.ENV_CONFIG');
    } else {
      console.log('⚠️ [CONFIG] window.ENV_CONFIG no está disponible');
    }
  }

  // Obtener una variable específica
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  // Establecer una variable específica
  set(key, value) {
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  // Obtener toda la configuración
  getAll() {
    return this.config;
  }

  // Verificar si está cargado
  isLoaded() {
    return this.loaded;
  }
}

// Instancia global del cargador de variables de entorno
const envLoader = new EnvironmentLoader();

// Configuración de variables de entorno
let CONFIG = {};

// Elementos del DOM
const elements = {
    searchTypeRadios: document.querySelectorAll('input[name="searchType"]'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    resultMessage: document.getElementById('resultMessage')
};

// Estado de la aplicación
let currentSearchType = 'cedula';

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
});

async function initializeApp() {
    try {
        // Cargar variables de entorno
        CONFIG = await envLoader.loadEnvironmentVariables();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Configurar placeholder inicial
        updatePlaceholder();
        
        // Configurar validación de entrada
        setupInputValidation();
        
        
    } catch (error) {
        console.error('Error inicializando la aplicación');
        showMessage('Error al inicializar la aplicación', 'error');
    }
}

function setupEventListeners() {
    // Cambio de tipo de búsqueda
    elements.searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentSearchType = this.value;
            updatePlaceholder();
            clearResults();
            elements.searchInput.value = '';
        });
    });
    
    // Búsqueda
    elements.searchBtn.addEventListener('click', performSearch);
    
    // Enter en el input
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Limpiar mensajes al escribir
    elements.searchInput.addEventListener('input', function() {
        clearResults();
        removeInputValidation();
    });
}

function updatePlaceholder() {
    const placeholder = currentSearchType === 'cedula' 
        ? 'Ingresa tu número de documento' 
        : 'Ingresa tu número de registro';
    elements.searchInput.placeholder = placeholder;
}

function setupInputValidation() {
    elements.searchInput.addEventListener('blur', validateInput);
}

function validateInput() {
    const value = elements.searchInput.value.trim();
    
    if (!value) {
        return false;
    }
    
    let isValid = false;
    let errorMessage = '';
    
    if (currentSearchType === 'cedula') {
        isValid = validateDocumento(value);
        if (!isValid) {
            errorMessage = `El número de documento debe tener entre ${CONFIG.VALIDATION.CEDULA_MIN_LENGTH} y ${CONFIG.VALIDATION.CEDULA_MAX_LENGTH} dígitos`;
        }
    } else {
        isValid = validateRegistro(value);
        if (!isValid) {
            errorMessage = `El número de registro debe empezar con RBAQ y tener al menos 4 caracteres`;
        }
    }
    
    if (!isValid) {
        showInputError(errorMessage);
        return false;
    } else {
        showInputSuccess();
        return true;
    }
}

function validateDocumento(documento) {
    const cleanDocumento = documento.replace(/\D/g, '');
    return cleanDocumento.length >= CONFIG.VALIDATION.CEDULA_MIN_LENGTH && 
           cleanDocumento.length <= CONFIG.VALIDATION.CEDULA_MAX_LENGTH;
}

function validateRegistro(registro) {
    // Validar que empiece con RBAQ y tenga al menos 4 caracteres (RBAQ + al menos 1)
    const registroPattern = /^RBAQ.+/;
    return registroPattern.test(registro) && registro.length >= CONFIG.VALIDATION.CODIGO_MIN_LENGTH;
}

function showInputError(message) {
    elements.searchInput.classList.add('input-error');
    elements.searchInput.classList.remove('input-success');
    showMessage(message, 'error');
}

function showInputSuccess() {
    elements.searchInput.classList.remove('input-error');
    elements.searchInput.classList.add('input-success');
}

function removeInputValidation() {
    elements.searchInput.classList.remove('input-error', 'input-success');
}

async function performSearch() {
    const searchValue = elements.searchInput.value.trim();
    
    if (!searchValue) {
        showMessage(CONFIG.MESSAGES.INVALID_INPUT, 'error');
        return;
    }
    
    if (!validateInput()) {
        return;
    }
    
    try {
        showLoading(true);
        clearResults();
        
        const result = await searchInDatabase(searchValue);
        handleSearchResult(result, searchValue);
        
    } catch (error) {
        console.error('Error en la búsqueda');
        showMessage(CONFIG.MESSAGES.ERROR_SEARCH, 'error');
    } finally {
        showLoading(false);
    }
}

async function searchInDatabase(searchValue) {
    try {
        // 1. Verificar caché de resultados de búsqueda específicos
        const cachedResult = cacheManager.getSearchResult(currentSearchType, searchValue);
        if (cachedResult) {
            return cachedResult;
        }
        
        // 2. Búsqueda específica a través del proxy con balanceador de carga
        const proxyUrl = loadBalancer.getNextProxy();
        const searchUrl = `${proxyUrl}?searchType=${currentSearchType}&searchValue=${encodeURIComponent(searchValue)}`;
        
        
        let response;
        try {
            response = await fetch(searchUrl);
        } catch (error) {
            console.log(`🔄 [BALANCEADOR] Marcando como fallido y reintentando...`);
            
            // Marcar proxy como fallido y reintentar con otro
            loadBalancer.markProxyFailed(proxyUrl);
            const fallbackProxyUrl = loadBalancer.getNextProxy();
            const fallbackSearchUrl = `${fallbackProxyUrl}?searchType=${currentSearchType}&searchValue=${encodeURIComponent(searchValue)}`;
            
            response = await fetch(fallbackSearchUrl);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error del servidor');
        }
        
        // 3. Procesar resultado de búsqueda específica
        let searchResult;
        if (result.found) {
            // Registro encontrado
            searchResult = {
                found: true,
                row: 1, // No importa el número de fila para búsqueda específica
                searchValue: searchValue,
                columnName: result.columnName,
                searchType: currentSearchType,
                totalRows: result.totalRows,
                message: currentSearchType === 'cedula' ? CONFIG.MESSAGES.CEDULA_FOUND : CONFIG.MESSAGES.CODIGO_FOUND,
                searchMethod: 'specific',
                rowData: result.row
            };
        } else {
            // Registro no encontrado
            searchResult = {
                found: false,
                row: -1,
                searchValue: searchValue,
                columnName: result.columnName,
                searchType: currentSearchType,
                totalRows: result.totalRows,
                message: currentSearchType === 'cedula' ? CONFIG.MESSAGES.CEDULA_NOT_FOUND : CONFIG.MESSAGES.CODIGO_NOT_FOUND,
                searchMethod: 'specific'
            };
        }
        
        // 4. Guardar resultado en caché
        cacheManager.setSearchResult(currentSearchType, searchValue, searchResult);
        
        return searchResult;
        
    } catch (error) {
        console.error('Error en searchInDatabase');
        throw error;
    }
}

function handleSearchResult(result, searchValue) {
    if (result.found) {
        // Persona encontrada - ya fue censada
        const message = currentSearchType === 'cedula' 
            ? CONFIG.MESSAGES.CEDULA_FOUND 
            : CONFIG.MESSAGES.CODIGO_FOUND;
        showMessage(message, 'success');
    } else {
        // Persona no encontrada - mostrar botón de redirección
        const message = currentSearchType === 'cedula' 
            ? CONFIG.MESSAGES.CEDULA_NOT_FOUND 
            : CONFIG.MESSAGES.CODIGO_NOT_FOUND;
        showMessage(message, 'warning');
        showRedirectButton(currentSearchType);
    }
}

function showLoading(show) {
    elements.loadingSpinner.style.display = show ? 'flex' : 'none';
    elements.searchBtn.disabled = show;
}

function showMessage(message, type) {
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = `result-message ${type}`;
    elements.resultMessage.style.display = 'block';
    
    // Scroll suave al mensaje
    elements.resultMessage.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

function clearResults() {
    elements.resultMessage.style.display = 'none';
    hideRedirectButton();
}

// Función para mostrar el botón de redirección
function showRedirectButton(searchType) {
    // Crear el botón si no existe
    let redirectBtn = document.getElementById('redirectBtn');
    if (!redirectBtn) {
        redirectBtn = document.createElement('button');
        redirectBtn.id = 'redirectBtn';
        redirectBtn.className = 'redirect-button';
        redirectBtn.innerHTML = `
            <span class="button-icon">📝</span>
            <span class="button-text">Ir al Formulario</span>
        `;
        
        // Insertar después del mensaje de resultado
        elements.resultMessage.parentNode.insertBefore(redirectBtn, elements.resultMessage.nextSibling);
    }
    
    // Configurar el botón según el tipo de búsqueda
    const redirectUrl = searchType === 'cedula' 
        ? CONFIG.REDIRECT_URLS.CEDULA_NOT_FOUND 
        : CONFIG.REDIRECT_URLS.CODIGO_NOT_FOUND;
    
    console.log('🔗 [REDIRECT] Configurando redirección para:', searchType);
    
    const buttonText = searchType === 'cedula' 
        ? 'Formulario de Documento' 
        : 'Formulario de Registro';
    
    redirectBtn.querySelector('.button-text').textContent = buttonText;
    
    // Configurar el evento de clic
    redirectBtn.onclick = () => {
        window.open(redirectUrl, '_blank');
    };
    
    // Mostrar el botón con animación
    redirectBtn.style.display = 'flex';
    redirectBtn.style.opacity = '0';
    redirectBtn.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        redirectBtn.style.transition = 'all 0.3s ease';
        redirectBtn.style.opacity = '1';
        redirectBtn.style.transform = 'translateY(0)';
    }, 100);
}

// Función para ocultar el botón de redirección
function hideRedirectButton() {
    const redirectBtn = document.getElementById('redirectBtn');
    if (redirectBtn) {
        redirectBtn.style.display = 'none';
    }
}

// Función para actualizar configuración dinámicamente
function updateConfig(key, value) {
    envLoader.set(key, value);
    CONFIG = envLoader.getAll();
}

// Función para obtener configuración actual
function getConfig() {
    return CONFIG;
}

// Función para probar la conexión con el proxy
async function testGoogleSheetsConnection() {
    try {
        const response = await fetch(CONFIG.PROXY_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error del servidor');
        }
        
        const values = result.data.values || [];
        const headers = values[0] || [];
        
        return {
            success: true,
            message: 'Conexión exitosa con el proxy',
            data: {
                totalRows: values.length,
                headers: headers
            }
        };
        
    } catch (error) {
        console.error('Error en la conexión');
        return {
            success: false,
            error: 'Error de conexión'
        };
    }
}

// Función para forzar actualización de datos
function forceDataRefresh() {
    cacheManager.forceUpdate();
    return 'Datos actualizados - la próxima búsqueda obtendrá información fresca';
}

// Función para probar la búsqueda optimizada
function testOptimizedSearch() {
    const stats = cacheManager.getStats();
    return {
        indexBuilt: stats.indexBuilt,
        indexedColumns: stats.indexedColumns,
        totalRows: stats.lastRowCount,
        cacheAge: stats.cacheAge,
        hitRate: stats.hitRate
    };
}

// Exponer funciones para debugging y configuración
window.censoApp = {
    CONFIG,
    envLoader,
    cacheManager,
    updateConfig,
    getConfig,
    performSearch,
    validateInput,
    testGoogleSheetsConnection,
    forceDataRefresh,
    testOptimizedSearch
};