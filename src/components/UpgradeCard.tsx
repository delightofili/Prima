import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export function UpgradeCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="card space-y-3 border-accent-500 bg-accent-50 text-center">
      <Lock size={28} className="mx-auto" />
      <p className="text-lg font-bold">{title}</p>
      <p className="mx-auto max-w-md text-subtext">{text}</p>
      <Link to="/plans" className="btn btn-accent mx-auto sm:w-64">
        See Pro plan
      </Link>
    </section>
  );
}
