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
    console.log('[useSeeMeGeneratedAsset] Hook mounted/updated:', { userEmail, visionId });
    
    if (!userEmail) {
      console.log('[useSeeMeGeneratedAsset] No userEmail provided, skipping load');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        console.log('[useSeeMeGeneratedAsset] STEP 1: Starting asset load...');
        setLoading(true);
        setError(null);

        // Query for active generated images for this user/vision
        const query = visionId
          ? { user_email: userEmail, vision_id: visionId, is_active: true }
          : { user_email: userEmail, is_active: true };

        console.log('[useSeeMeGeneratedAsset] STEP 2: Query filter:', query);
        const assets = await base44.entities.SeeMeGeneratedImage.filter(query, '-created_date', 1);

        console.log('[useSeeMeGeneratedAsset] STEP 3: Query returned', assets?.length || 0, 'asset(s)');
        
        if (assets && assets.length > 0) {
          const asset = assets[0];
          console.log('[useSeeMeGeneratedAsset] STEP 4: Asset found!');
          console.log('[useSeeMeGeneratedAsset] STEP 4: Asset ID:', asset.id);
          console.log('[useSeeMeGeneratedAsset] STEP 4: Generated image URL:', asset.generated_image_url);
          console.log('[useSeeMeGeneratedAsset] STEP 4: Is active:', asset.is_active);
          console.log('[useSeeMeGeneratedAsset] STEP 4: Full asset:', asset);
          setAsset(asset);
        } else {
          console.log('[useSeeMeGeneratedAsset] STEP 3: No saved asset found for query:', query);
          setAsset(null);
        }
        
        console.log('[useSeeMeGeneratedAsset] COMPLETE: Asset load finished');
      } catch (err) {
        console.error('[useSeeMeGeneratedAsset] FAILED:', err.message, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userEmail, visionId]);

  return { asset, loading, error };
}