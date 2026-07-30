const stages = [
  "Describe",
  "Review",
  "Unlock & send",
];

export default function PetitionProgress({
  currentStep = 1,
}) {
  return (
    <div
      className="pd-progress"
      aria-label={`Step ${currentStep} of 3`}
    >
      {stages.map(
        (
          label,
          index
        ) => {
          const step =
            index + 1;

          const active =
            step <=
            currentStep;

          return (
            <div
              className={
                active
                  ? "pd-progress__item pd-progress__item--active"
                  : "pd-progress__item"
              }
              key={
                label
              }
            >
              <span className="pd-progress__number">
                {
                  step
                }
              </span>

              <span className="pd-progress__label">
                {
                  label
                }
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}
