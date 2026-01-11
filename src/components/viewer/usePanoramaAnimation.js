import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hook để quản lý animation loop và cập nhật camera position
 */
export const usePanoramaAnimation = (
  rendererRef,
  sceneRef,
  cameraRef,
  lon,
  lat,
  updateHotspotPositions,
  onFovChange
) => {
  const rafRef = useRef(null);
  const fovRef = useRef(75);

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;

    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const threeScene = sceneRef.current;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      
      lat.current = Math.max(-85, Math.min(85, lat.current));
      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
      camera.position.y = 100 * Math.cos(phi);
      camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);

      renderer.render(threeScene, camera);
      
      // Cập nhật hotspot positions mỗi frame
      if (updateHotspotPositions) {
        updateHotspotPositions();
      }
      
      // Chỉ update FOV display khi thay đổi
      if (Math.abs(fovRef.current - camera.fov) > 0.1) {
        fovRef.current = camera.fov;
        if (onFovChange) {
          onFovChange(camera.fov);
        }
      }
    }

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [rendererRef, sceneRef, cameraRef, lon, lat, updateHotspotPositions, onFovChange]);

  return { fovRef };
};
