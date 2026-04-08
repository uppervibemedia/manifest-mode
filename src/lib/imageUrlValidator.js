/**
 * Validates and sanitizes image URLs for display
 * Prevents blob: URLs, UUIDs, and invalid URLs from being rendered
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Reject blob URLs
  if (url.startsWith('blob:')) {
    console.warn('[imageUrlValidator] Blocked blob: URL', url);
    return false;
  }
  
  // Reject data URLs
  if (url.startsWith('data:')) {
    console.warn('[imageUrlValidator] Blocked data: URL');
    return false;
  }
  
  // Reject UUID-only strings
  if (UUID_PATTERN.test(url)) {
    console.warn('[imageUrlValidator] Blocked UUID-only string', url);
    return false;
  }
  
  // Accept http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  console.warn('[imageUrlValidator] Invalid URL format', url);
  return false;
}

export function logImageUrlStatus(visionId, imageUrl) {
  const isBlob = imageUrl?.startsWith('blob:');
  const isUuid = UUID_PATTERN.test(imageUrl);
  const isHttps = imageUrl?.startsWith('https://');
  const isHttp = imageUrl?.startsWith('http://');
  
  console.log(`[Vision ${visionId}] Image URL Status:`, {
    rawUrl: imageUrl,
    isBlob,
    isUuid,
    isHttps,
    isHttp,
    isValid: isHttps || isHttp
  });
}