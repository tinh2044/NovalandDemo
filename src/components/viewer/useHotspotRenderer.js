import { useRef, useCallback } from 'react';
import * as THREE from 'three';

/**
 * Hook để render và cập nhật vị trí hotspots trên panorama
 */
export const useHotspotRenderer = (cameraRef, containerRef, scene) => {
  const hotspotRefs = useRef({});
  const currentSceneRef = useRef(scene);

  // Cập nhật ref khi scene thay đổi
  currentSceneRef.current = scene;

  // Hàm cập nhật hotspot positions
  const updateHotspotPositions = useCallback(() => {
    const currentScene = currentSceneRef.current;
    if (!currentScene?.hotspots || !containerRef.current || !cameraRef.current) return;

    const camera = cameraRef.current;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Lấy hướng camera đang nhìn
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    currentScene.hotspots.forEach((hotspot) => {
      const el = hotspotRefs.current[hotspot.id];
      if (!el) return;

      const { x, y, z } = hotspot.position;
      const position3D = new THREE.Vector3(x, y, z);
      
      // Tính hướng từ camera đến hotspot
      const toHotspot = position3D.clone().sub(camera.position).normalize();
      
      // Dot product: nếu > 0 thì hotspot nằm phía trước camera
      const dot = cameraDirection.dot(toHotspot);
      const isInFrontOfCamera = dot > 0;

      // Chỉ tính screen position nếu nằm phía trước
      if (isInFrontOfCamera) {
        const projected = position3D.clone();
        projected.project(camera);
        
        const screenX = (projected.x * 0.5 + 0.5) * width;
        const screenY = (-projected.y * 0.5 + 0.5) * height;
        
        const margin = 100;
        const inViewport = screenX >= -margin && screenX <= width + margin &&
                          screenY >= -margin && screenY <= height + margin;

        if (inViewport) {
          el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;
          el.style.display = 'flex';
        } else {
          el.style.display = 'none';
        }
      } else {
        // Hotspot nằm phía sau camera - ẩn đi
        el.style.display = 'none';
      }
    });
  }, [cameraRef, containerRef]);

  // Lưu ref cho mỗi hotspot element
  const setHotspotRef = useCallback((id) => (el) => {
    hotspotRefs.current[id] = el;
  }, []);

  return { updateHotspotPositions, setHotspotRef };
};
