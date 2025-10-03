// Vercel API function to handle maintenance mode
import { isMaintenanceMode, getMaintenancePageContent } from '../src/utils/maintenanceUtils';

export default function handler(req, res) {
  // Check if maintenance mode is enabled
  if (isMaintenanceMode()) {
    // Return maintenance page
    res.setHeader('Content-Type', 'text/html');
    res.status(503).send(getMaintenancePageContent());
    return;
  }

  // If not in maintenance mode, redirect to the app
  res.redirect(302, '/');
}
