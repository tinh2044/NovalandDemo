/**
 * Component hiển thị FOV (Field of View) hiện tại
 */
const FovDisplay = ({ fov }) => {
  return (
    <div className="fov-display">
      FOV: {fov.toFixed(1)}°
    </div>
  );
};

export default FovDisplay;
