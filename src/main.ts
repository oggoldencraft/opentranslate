import './styles/global.css';
import { loadSettingsFromCookies } from './utils/cookies';
import { applyThemeToDocument } from './utils/theme';
import './components/app-root';

// Apply cookie-saved or default Material 3 cool-green (#00A884) dark theme immediately on boot
const initialSettings = loadSettingsFromCookies();
applyThemeToDocument(initialSettings);
