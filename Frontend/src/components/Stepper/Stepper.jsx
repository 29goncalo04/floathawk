import "./Stepper.css"

export default function Stepper({ currentStep, steps, onStepClick }) {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = index < currentStep;

        return (
          <div key={index} className="stepper_item">
            
            <div
              className={`circle 
                ${isActive ? "active" : ""} 
                ${isCompleted ? "completed" : ""}
                ${isClickable ? "clickable" : ""}`}
              onClick={() => {
                if (isClickable) onStepClick(index);
              }}
            >
              <span className="number">{index + 1}</span>
              <span className="check">✔</span>
            </div>

            <div className={`label ${isActive ? "active" : ""}`}>
              {step.title}
            </div>

            {index < steps.length - 1 && (
              <div className={`line ${isCompleted ? "filled" : ""}`} />
            )}

          </div>
        );
      })}
    </div>
  );
}