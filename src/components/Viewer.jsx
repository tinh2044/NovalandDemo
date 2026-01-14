import { useRef, useState } from 'react';
import { usePanoramaRenderer } from './viewer/usePanoramaRenderer';
import { usePanoramaControls } from './viewer/usePanoramaControls';
import { usePanoramaAnimation } from './viewer/usePanoramaAnimation';
import { usePanoramaTexture } from './viewer/usePanoramaTexture';
import { useHotspotRenderer } from './viewer/useHotspotRenderer';
import Hotspot from './viewer/Hotspot';
import FovDisplay from './viewer/FovDisplay';

/**
 * Component chính để hiển thị 360° panorama viewer
 */
const Viewer = ({ scene, currentSceneId, onSceneChange, onReady }) => {
  const containerRef = useRef(null);
  const [currentFov, setCurrentFov] = useState(75);

  // Khởi tạo Three.js renderer, scene, camera, sphere
  const { rendererRef, sceneRef, cameraRef, sphereRef } = usePanoramaRenderer(containerRef);

  // Quản lý camera controls
  const { lon, lat } = usePanoramaControls(cameraRef, rendererRef, sceneRef);

  // Quản lý hotspot rendering
  const { updateHotspotPositions, setHotspotRef } = useHotspotRenderer(
    cameraRef,
    containerRef,
    scene
  );

  // Animation loop
  usePanoramaAnimation(
    rendererRef,
    sceneRef,
    cameraRef,
    lon,
    lat,
    updateHotspotPositions,
    setCurrentFov
  );

  // Load texture khi scene thay đổi
  usePanoramaTexture(sphereRef, cameraRef, scene, lon, lat, onReady);

  return (
    <>
      <div ref={containerRef} className="panorama-viewer" />
      
      {/* Render hotspots */}
      {scene?.hotspots?.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          hotspot={hotspot}
          currentSceneId={currentSceneId}
          onSceneChange={onSceneChange}
          setHotspotRef={setHotspotRef}
        />
      ))}

      {/* <FovDisplay fov={currentFov} /> */}
    </>
  );
};

export default Viewer;
