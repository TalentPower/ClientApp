// Error handling utilities for the app

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleFirebaseError = (error: any): AppError => {
  console.error('Firebase Error:', error);
  
  if (error?.code) {
    switch (error.code) {
      case 'auth/admin-restricted-operation':
        return new AppError(
          'Operación restringida para administradores',
          'AUTH_RESTRICTED',
          error
        );
      case 'firestore/permission-denied':
        return new AppError(
          'Permisos insuficientes para esta operación',
          'PERMISSION_DENIED',
          error
        );
      case 'firestore/unavailable':
        return new AppError(
          'Servicio de base de datos no disponible',
          'SERVICE_UNAVAILABLE',
          error
        );
      default:
        return new AppError(
          `Error de Firebase: ${error.message || 'Error desconocido'}`,
          error.code,
          error
        );
    }
  }
  
  return new AppError(
    'Error inesperado en el servicio',
    'UNKNOWN_ERROR',
    error
  );
};

export const handleLocationError = (error: any): AppError => {
  console.error('Location Error:', error);
  
  switch (error?.code) {
    case 1: // PERMISSION_DENIED
      return new AppError(
        'Permisos de ubicación denegados',
        'LOCATION_PERMISSION_DENIED',
        error
      );
    case 2: // POSITION_UNAVAILABLE
      return new AppError(
        'Ubicación no disponible',
        'LOCATION_UNAVAILABLE',
        error
      );
    case 3: // TIMEOUT
      return new AppError(
        'Tiempo de espera agotado para obtener ubicación',
        'LOCATION_TIMEOUT',
        error
      );
    default:
      return new AppError(
        'Error al obtener ubicación',
        'LOCATION_ERROR',
        error
      );
  }
};

export const safeAsyncCall = async <T>(
  asyncFn: () => Promise<T>,
  fallback?: T,
  errorHandler?: (error: Error) => void
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error as Error);
    } else {
      console.error('Safe async call failed:', error);
    }
    return fallback || null;
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError!;
};
