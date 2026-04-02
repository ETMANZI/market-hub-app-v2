import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  Phone,
  BadgeHelp,
  Megaphone,
  Handshake,
  Building2,
  ExternalLink,
} from "lucide-react";
import Card from "../ui/Card";
import { isAuthenticated } from "../../lib/auth";
import { api } from "../../lib/api";

type Partner = {
  id: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string;
  is_active?: boolean;
};

export default function RightSidebar() {
  const loggedIn = isAuthenticated();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await api.get("/partners/");
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setPartners(data);
      } catch (error) {
        console.error("Failed to load partners", error);
        setPartners([]);
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, []);

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>

        <div className="mt-4 space-y-3">
          {loggedIn ? (
            <>
              <Link
                to="/publish"
                className="flex items-center gap-2 rounded-2xl bg-slate-400 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <PlusCircle size={16} />
                Post Listing
              </Link>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-2xl bg-slate-400 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <PlusCircle size={16} />
                Create Account
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LayoutDashboard size={16} />
                Sign In
              </Link>
            </>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Megaphone size={18} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Promote Your Listing
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Reach more buyers and renters by publishing clear photos, strong
              titles, and complete contact details.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Handshake size={18} />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Our Partners</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We work with trusted partners across real estate, vehicles,
              decoration, and business promotion.
            </p>

            <div className="mt-4 space-y-3">
              {loadingPartners ? (
                <p className="text-sm text-slate-500">Loading partners...</p>
              ) : partners.length === 0 ? (
                <p className="text-sm text-slate-500">No partners available.</p>
              ) : (
                partners.map((partner) => {
                  const isClickable = Boolean(partner.website && partner.website.trim());

                  const card = (
                    <div
                      className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition ${
                        isClickable
                          ? "cursor-pointer hover:border-slate-300 hover:bg-white hover:shadow-sm"
                          : ""
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Building2 size={18} className="text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {partner.name}
                        </p>
                        {partner.description && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {partner.description}
                          </p>
                        )}
                      </div>

                      {isClickable && (
                        <ExternalLink size={15} className="shrink-0 text-slate-400" />
                      )}
                    </div>
                  );

                  return isClickable ? (
                    <a
                      key={partner.id}
                      href={partner.website!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={partner.id}>{card}</div>
                  );
                })
              )}
            </div>

            <Link
              to="/partners"
              className="mt-4 inline-flex items-center text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
            >
              View all partners
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-900">Safety Tips</h3>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
            <p>Verify location, price, and ownership details before payment.</p>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
            <p>Meet in a safe place when inspecting property or vehicles.</p>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-600" />
            <p>Avoid sending money before confirming the listing is genuine.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-900">Need Help?</h3>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-slate-500" />
            <span>+250 788 263 338</span>
          </div>

          <div className="flex items-center gap-2">
            <BadgeHelp size={15} className="text-slate-500" />
            <span>Support available for posting and account setup</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}