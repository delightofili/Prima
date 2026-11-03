import { handleWebhook } from "../_shared/handlers.ts";
import { serve } from "../_shared/deps.ts";

serve(handleWebhook);
