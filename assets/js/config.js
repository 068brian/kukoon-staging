/* Kukoon site configuration.
   endpoint: paste the GoHighLevel inbound webhook URL (Automation > Workflows > "Inbound Webhook" trigger).
   Leave empty on staging to run the form in test mode (nothing is sent). */
window.KUKOON_CONFIG = {
  endpoint: "",
  gtmId: "", /* optional Google Tag Manager ID, e.g. GTM-XXXXXXX. Leave empty until privacy sign-off. */
  minSeconds: 3
};
