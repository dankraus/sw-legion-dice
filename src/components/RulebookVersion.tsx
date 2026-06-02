import {
  CORE_RULE_BOOK_DOCS_URL,
  CORE_RULE_BOOK_EFFECTIVE_DATE,
} from '../rulebook';

export function RulebookVersion() {
  return (
    <p className="app__rulebook-version">
      <a
        href={CORE_RULE_BOOK_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Star Wars Legion Core Rule Book on Atomic Mass Games (opens in new tab)"
      >
        Core Rule Book effective {CORE_RULE_BOOK_EFFECTIVE_DATE}
      </a>
    </p>
  );
}
