import BrandMark from "../brand/BrandMark.jsx";

export default function SiteFooter() {
  return (
    <footer className="pd-footer">
      <div className="pd-container pd-footer__main">
        <div>
          <BrandMark
            compact
          />

          <p>
            AI guidance. Legal clarity. Your control.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <a href="#draft-petition">
            Draft
          </a>

          <a href="#how-it-works">
            How it works
          </a>

          <a href="/contact">
            Support
          </a>
        </nav>
      </div>

      <div className="pd-container pd-footer__bottom">
        <span>
          © {new Date().getFullYear()} PetitionDesk
        </span>

        <span>
          Drafting guidance—not legal representation.
        </span>
      </div>
    </footer>
  );
}
