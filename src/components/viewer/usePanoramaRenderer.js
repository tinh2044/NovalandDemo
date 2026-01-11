import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hook để khởi tạo và quản lý Three.js renderer, scene, camera, sphere
 */
export const usePanoramaRenderer = (containerRef) => {
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // Sphere geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sphere = new THREE.Mesh(geometry, material);
    threeScene.add(sphere);
    sphereRef.current = sphere;

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);

  return { rendererRef, sceneRef, cameraRef, sphereRef };
};
