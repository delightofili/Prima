function need(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value)
    throw new Error(
      `Missing ${name}. Add it to .env.local and restart npm run dev.`,
    );
  return value;
}

export interface FacilityInfo {
  id: string;
  name: string;
  code: string;
  lga: string;
  state: string;
  plan: "free" | "basic" | "pro";
}

// The facility comes from the signed-in account, not from a setting in the app.
let current: FacilityInfo | null = null;
export const setCurrentFacility = (f: FacilityInfo | null) => {
  current = f;
};
export const getCurrentFacility = () => current;

function facility(): FacilityInfo {
  if (!current) throw new Error("No facility is signed in.");
  return current;
}

export const config = {
  supabaseUrl: need("VITE_SUPABASE_URL"),
  supabaseKey: need("VITE_SUPABASE_KEY"),
  pythonApiUrl: (
    (import.meta.env.VITE_PYTHON_API_URL as string | undefined) ?? ""
  ).trim(),
  get facilityId() {
    return facility().id;
  },
  get facilityCode() {
    return facility().code;
  },
  get facilityName() {
    return facility().name;
  },
  get facilityLga() {
    return facility().lga;
  },
  get facilityState() {
    return facility().state;
  },
};
