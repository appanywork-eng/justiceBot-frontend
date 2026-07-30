const steps = [
  {
    number: "1",
    symbol: "✎",
    title: "Describe",
    text: "Share the facts.",
  },
  {
    number: "2",
    symbol: "✓",
    title: "Review",
    text: "Check the draft.",
  },
  {
    number: "3",
    symbol: "➤",
    title: "Send",
    text: "Send it yourself.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="pd-section pd-how-it-works"
    >
      <div className="pd-compact-heading">
        <div>
          <span className="pd-eyebrow">
            How it works
          </span>

          <h2>
            Three simple steps
          </h2>
        </div>

        <p>
          You write. We guide. You send.
        </p>
      </div>

      <div className="pd-step-grid">
        {steps.map(
          (step) => (
            <article
              className="pd-step-card"
              key={step.number}
            >
              <div className="pd-step-card__icon">
                {step.symbol}
              </div>

              <span className="pd-step-card__number">
                {step.number}
              </span>

              <h3>
                {step.title}
              </h3>

              <p>
                {step.text}
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}
