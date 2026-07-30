export default function BrandMark({
  onActivate,
  compact = false,
}) {
  return (
    <a
      href="/"
      className={
        compact
          ? "pd-brand pd-brand--compact"
          : "pd-brand"
      }
      aria-label="PetitionDesk home"
      onClick={(event) => {
        if (onActivate) {
          event.preventDefault();
          onActivate();
        }
      }}
    >
      <img
        src="/petitiondesk-mark.svg"
        alt=""
        className="pd-brand__mark"
        aria-hidden="true"
      />

      <span className="pd-brand__copy">
        <span className="pd-brand__name">
          Petition<span>Desk</span>
        </span>

        {!compact && (
          <span className="pd-brand__tagline">
            AI petition drafting
          </span>
        )}
      </span>
    </a>
  );
}
