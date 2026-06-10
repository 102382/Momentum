// Centrale backend-URL.
// In de browser leiden we het adres af van waar de frontend draait,
// zodat de app ook werkt wanneer iemand hem via jouw IP-adres opent
// (bijv. http://145.118.41.148:3000 -> backend http://145.118.41.148:3001).
// Buiten de browser (server-side) vallen we terug op localhost.
export const API_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001";
