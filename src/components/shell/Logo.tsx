import { Link } from "react-router-dom";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

export function Logo() {
  return (
    <Link
      to="/"
      className={`${typography.brandLogo} ${interactive.accentHover}`}
    >
      ALCYONA
    </Link>
  );
}
