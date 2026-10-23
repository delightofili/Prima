import { Dhis2Card } from "./Dhis2Card";
import { FhirCard } from "./FhirCard";

export function ExchangeView() {
  return (
    <div className="space-y-4">
      <p className="text-subtext">
        Standard files for sharing with health information systems. Both are
        made on this phone from the records it holds.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <FhirCard />
        <Dhis2Card />
      </div>
    </div>
  );
}
