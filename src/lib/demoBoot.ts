// Imported FIRST in main.tsx, so the cut-off is in place before any other file loads and before anything can start a request.
import { installDemoGuard } from "./demoGuard";

installDemoGuard();
