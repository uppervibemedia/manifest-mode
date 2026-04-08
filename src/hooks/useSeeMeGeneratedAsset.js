import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Loads the most recent saved SeeMeGeneratedImage asset for a user/vision
 * Returns null if no saved asset exists
 */
export function useSeeMeGeneratedAsset(userEmail, visionId = null) {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Query for active generated images for this user/vision
        const query = visionId
          ? { user_email: userEmail, vision_id: visionId, is_active: true }
          : { user_email: userEmail, is_active: true };

        const assets = await base44.entities.SeeMeGeneratedImage.filter(query, '-created_date', 1);

        if (assets && assets.length > 0) {
          console.log('[useSeeMeGeneratedAsset] Loaded saved asset:', assets[0].id);
          setAsset(assets[0]);
        } else {
          console.log('[useSeeMeGeneratedAsset] No saved asset found');
          setAsset(null);
        }
      } catch (err) {
        console.error('[useSeeMeGeneratedAsset] Error loading asset:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userEmail, visionId]);

  return { asset, loading, error };
}