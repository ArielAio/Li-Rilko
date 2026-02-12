export function IconCart({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M2.5 3H5l2.3 10.1a1 1 0 0 0 .98.78h9.9a1 1 0 0 0 .98-.78L21 6H6.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCartPlus({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M2.5 3H5l2.3 10.1a1 1 0 0 0 .98.78h9.9a1 1 0 0 0 .98-.78L21 6H6.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 3.5v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.5 5.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconSearch({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconChat({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 14.7a6.6 6.6 0 0 1-.8 3.1L20.2 22l-4.2-1A8.6 8.6 0 0 1 12 22C7 22 3 18.4 3 14c0-4.4 4-8 9-8s9 3.6 9 8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.8 13.6h6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.8 10.6h4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M9 4h6m-8 3 1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.5v5.8M14 10.5v5.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowRight({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenu({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
