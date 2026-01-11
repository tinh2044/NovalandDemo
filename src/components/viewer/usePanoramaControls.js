import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hook để quản lý camera controls (mouse, touch, wheel)
 */
export const usePanoramaControls = (cameraRef, rendererRef, sceneRef) => {
  const isUserInteracting = useRef(false);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const lon = useRef(0);
  const lat = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);

  useEffect(() => {
    if (!rendererRef.current) return;

    const canvas = rendererRef.current.domElement;
    const camera = cameraRef.current;

    const onPointerDown = (event) => {
      isUserInteracting.current = true;
      onPointerDownMouseX.current = event.clientX;
      onPointerDownMouseY.current = event.clientY;
      onPointerDownLon.current = lon.current;
      onPointerDownLat.current = lat.current;
    };

    const onPointerMove = (event) => {
      if (!isUserInteracting.current) return;
      lon.current = (onPointerDownMouseX.current - event.clientX) * 0.1 + onPointerDownLon.current;
      lat.current = (event.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
    };

    const onPointerUp = () => {
      isUserInteracting.current = false;
    };

    const onWheel = (event) => {
      event.preventDefault();
      const fov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(fov, 30, 100);
      camera.updateProjectionMatrix();
    };

    const onTouchStart = (event) => {
      if (event.touches.length === 1) {
        onPointerDown({ clientX: event.touches[0].screenX, clientY: event.touches[0].screenY });
      }
    };

    const onTouchMove = (event) => {
      if (event.touches.length === 1) {
        onPointerMove({ clientX: event.touches[0].screenX, clientY: event.touches[0].screenY });
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onPointerUp);
    };
  }, [cameraRef, rendererRef, sceneRef]);

  return { lon, lat };
};
