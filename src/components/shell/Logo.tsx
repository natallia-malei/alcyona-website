import { Link } from "react-router-dom";
import { typography } from "../../styles/typography";

export function Logo() {
  return (
    <Link
      to="/"
      className={`${typography.brandLogo} hover:text-accent transition-colors`}
    >
      ALCYONA
    </Link>
  );
}
