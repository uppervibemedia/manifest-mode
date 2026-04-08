// Fallback localStorage storage for visions when backend persistence fails
// Prevents data loss while backend issues are being resolved

const FALLBACK_STORAGE_KEY = 'vision_board_fallback';

/**
 * Get all fallback visions from localStorage
 */
export function getFallbackVisions(userEmail) {
  if (!userEmail) return [];
  try {
    const stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!stored) return [];
    const allVisions = JSON.parse(stored);
    // Filter to current user
    return allVisions.filter(v => v.user_email === userEmail) || [];
  } catch (err) {
    console.error('[visionFallbackStorage] Failed to read fallback visions:', err);
    return [];
  }
}

/**
 * Save a vision to fallback localStorage
 * Called when backend persistence fails
 */
export function saveFallbackVision(vision, userEmail) {
  if (!userEmail) return null;
  try {
    const stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
    const allVisions = stored ? JSON.parse(stored) : [];
    
    // Create fallback record with local ID
    const fallbackVision = {
      id: `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...vision,
      user_email: userEmail,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending_backend', // Mark as needing backend sync
      isFallback: true,
    };
    
    allVisions.push(fallbackVision);
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allVisions));
    
    console.log('[visionFallbackStorage] Saved fallback vision:', {
      id: fallbackVision.id,
      title: fallbackVision.title,
      syncStatus: fallbackVision.syncStatus,
    });
    
    return fallbackVision;
  } catch (err) {
    console.error('[visionFallbackStorage] Failed to save fallback vision:', err);
    return null;
  }
}

/**
 * Remove a fallback vision (e.g., when backend persistence succeeds)
 */
export function removeFallbackVision(fallbackId, userEmail) {
  if (!userEmail) return false;
  try {
    const stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!stored) return false;
    const allVisions = JSON.parse(stored);
    
    const filtered = allVisions.filter(
      v => !(v.user_email === userEmail && v.id === fallbackId)
    );
    
    if (filtered.length === allVisions.length) {
      // Not found
      return false;
    }
    
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(filtered));
    console.log('[visionFallbackStorage] Removed fallback vision:', fallbackId);
    return true;
  } catch (err) {
    console.error('[visionFallbackStorage] Failed to remove fallback vision:', err);
    return false;
  }
}

/**
 * Clear all fallback visions for a user
 */
export function clearFallbackVisions(userEmail) {
  if (!userEmail) return false;
  try {
    const stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!stored) return false;
    const allVisions = JSON.parse(stored);
    
    const filtered = allVisions.filter(v => v.user_email !== userEmail);
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('[visionFallbackStorage] Failed to clear fallback visions:', err);
    return false;
  }
}

/**
 * Update a fallback vision
 */
export function updateFallbackVision(fallbackId, updates, userEmail) {
  if (!userEmail) return null;
  try {
    const stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!stored) return null;
    const allVisions = JSON.parse(stored);
    
    const vision = allVisions.find(v => v.user_email === userEmail && v.id === fallbackId);
    if (!vision) return null;
    
    Object.assign(vision, updates);
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(allVisions));
    return vision;
  } catch (err) {
    console.error('[visionFallbackStorage] Failed to update fallback vision:', err);
    return null;
  }
}