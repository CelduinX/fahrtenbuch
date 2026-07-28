import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function DefaultCredentialsNotice() {
  return (
    <div className="status-enter mb-5 flex flex-col gap-3 rounded-2xl border border-[#efdba9] bg-[#fff7e5] px-4 py-3.5 text-sm text-[#7f5117] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-3 sm:items-center">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f8e7bc]">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
        </span>
        <span><strong>Standard-Zugang aktiv.</strong> Ändere Benutzername und Passwort in den Einstellungen.</span>
      </div>
      <a href="/settings?tab=credentials" className="self-end font-bold underline decoration-[#c9964d] underline-offset-4 sm:self-auto">Jetzt ändern</a>
    </div>
  );
}
