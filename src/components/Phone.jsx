// iPhone-style device frame. The frame, island and side buttons are pure CSS (see landing.css `.ph`).
export default function Phone({ src, alt = '', className = '', style }) {
  return (
    <div className={`ph ${className}`.trim()} style={style}>
      <img src={src} alt={alt} />
    </div>
  );
}
