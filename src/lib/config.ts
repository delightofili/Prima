function need(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value)
    throw new Error(
      `Missing ${name}. Add it to .env.local and restart npm run dev.`,
    );
  return value;
}

export const config = {
  supabaseUrl: need("VITE_SUPABASE_URL"),
  supabaseKey: need("VITE_SUPABASE_KEY"),
  facilityId: need("VITE_FACILITY_ID"),
  facilityCode: need("VITE_FACILITY_CODE"),
  facilityName: need("VITE_FACILITY_NAME"),
  facilityLga: need("VITE_FACILITY_LGA"),
  facilityState: need("VITE_FACILITY_STATE"),
  pythonApiUrl: need("VITE_PYTHON_API_URL"),
};
