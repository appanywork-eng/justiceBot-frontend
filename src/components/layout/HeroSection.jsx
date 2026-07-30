export default function HeroSection() {
  return (
    <section className="pd-hero">
      <div className="pd-container pd-hero__grid">
        <div className="pd-hero__content">
          <div className="pd-eyebrow">
            AI petition drafting
          </div>

          <h1>
            Write a petition.
            <span>
              Send it yourself.
            </span>
          </h1>

          <p className="pd-hero__lead">
            PetitionDesk turns your complaint into a clear petition,
            suggests the right authority and shows the safest
            delivery route.
          </p>

          <div className="pd-hero__actions">
            <a
              href="#draft-petition"
              className="pd-button pd-button--gold"
            >
              <span aria-hidden="true">
                ✦
              </span>

              Start Petition
            </a>

            <a
              href="#how-it-works"
              className="pd-button pd-button--outline"
            >
              How it works
              <span aria-hidden="true">
                →
              </span>
            </a>
          </div>

          <div className="pd-hero__trust">
            <div>
              <span aria-hidden="true">
                2
              </span>

              Free petitions
            </div>

            <div>
              <span aria-hidden="true">
                ✓
              </span>

              You stay in control
            </div>

            <div>
              <span aria-hidden="true">
                ◈
              </span>

              Official route guidance
            </div>
          </div>
        </div>

        <div
          className="pd-tech-visual"
          aria-hidden="true"
        >
          <div className="pd-tech-visual__grid" />

          <div className="pd-tech-visual__orbit pd-tech-visual__orbit--one" />
          <div className="pd-tech-visual__orbit pd-tech-visual__orbit--two" />

          <div className="pd-tech-visual__card">
            <img
              src="/petitiondesk-mark.svg"
              alt=""
            />

            <strong>
              Draft · Route · Send
            </strong>

            <span>
              You decide when to submit.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
