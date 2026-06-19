export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const FRONTEND_URL = process.env.FRONTEND_URL;

// Bouwt de juiste URL voor media (foto's/video's).
// Absolute URL's (bv. Cloudinary) worden ongewijzigd gebruikt; relatieve
// paden (oude data of standaard-avatars) worden aangevuld met API_URL.
export const mediaUrl = (pad) => {
  if (!pad) return pad;
  return /^https?:\/\//.test(pad) ? pad : `${API_URL}${pad}`;
};
