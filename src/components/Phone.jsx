import Img from './Img.jsx';

// iPhone-style device frame. The frame, island and side buttons are pure CSS (see landing.css `.ph`).
export default function Phone({ img, alt = '', className = '', style }) {
  return (
    <div className={`ph ${className}`.trim()} style={style}>
      <Img img={img} alt={alt} sizes="(max-width: 720px) 45vw, 340px" />
    </div>
  );
}
