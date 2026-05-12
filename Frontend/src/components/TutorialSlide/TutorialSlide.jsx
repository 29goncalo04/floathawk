import "./TutorialSlide.css";

export default function TutorialSlide({ image, icon: Icon, bullets }) {
  return (
    <div className={`tslide ${image ? "tslide--split" : "tslide--centered"}`}>
      {image ? (
        <div className="tslide_phone">
          <img src={image} alt="" className="tslide_phone_img" />
        </div>
      ) : (
        Icon && (
          <div className="tslide_icon_wrap">
            <Icon />
          </div>
        )
      )}
      <div className="tslide_steps">
        {bullets.map((text, i) => (
          <div key={i} className="tslide_step">
            <span className="tslide_step_num">{i + 1}</span>
            <p className="tslide_step_text">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
