// Configuración del entorno - NO SUBIR A REPOSITORIO
// Este archivo contiene keys sensibles

export const config = {
  firebase: {
    apiKey: 'AIzaSyAKdoSkj7rx3wsDMpXwW7xV5GZfNHY25pg',
    authDomain: 'apprutas-d7efc.firebaseapp.com',
    projectId: 'apprutas-d7efc',
    storageBucket: 'apprutas-d7efc.firebasestorage.app',
    messagingSenderId: '535300170980',
    appId: '1:535300170980:android:0c62c787468d6d4b8eb8f1',
  },
  googleMaps: {
    apiKey: 'AIzaSyCAdaWSy-79Vty_54kmn_4zfkiB2Rts3pA',
  },
  app: {
    name: 'DriverTracker',
    version: '1.0.0',
  },
  api: {
    baseUrl: 'http://98.93.56.182:8080',
    endpoints: {
      login: '/auth/login',
      tripLocations: '/api/trip-locations',
      routeTrips: '/api/route-trips',
    },
  },
};
