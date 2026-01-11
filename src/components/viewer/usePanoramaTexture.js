import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hook để load và cập nhật texture cho panorama sphere
 */
export const usePanoramaTexture = (sphereRef, cameraRef, scene, lon, lat, onReady) => {
  useEffect(() => {
    if (!sphereRef.current || !scene) return;

    const textureLoader = new THREE.TextureLoader();
    // Hỗ trợ cả 'image' (từ API) và 'panorama' (từ JSON cũ)
    const imageUrl = scene.image || scene.panorama;
    
    textureLoader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        sphereRef.current.material.dispose();
        sphereRef.current.material = new THREE.MeshBasicMaterial({ map: texture });
        
        // Set initial view
        if (scene.initialView) {
          lon.current = (scene.initialView.yaw * 180 / Math.PI);
          lat.current = (scene.initialView.pitch * 180 / Math.PI);
        }
        
        if (cameraRef.current && scene.initialView) {
          const initialFov = Math.min(100, Math.max(30, scene.initialView.fov));
          cameraRef.current.fov = initialFov;
          cameraRef.current.updateProjectionMatrix();
        }

        onReady?.();
      },
      undefined,
      (error) => {
        console.error('Error loading panorama:', error);
      }
    );
  }, [sphereRef, cameraRef, scene, lon, lat, onReady]);
};
