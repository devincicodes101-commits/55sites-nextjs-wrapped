# Vapi setup checklist

Work through this in order. The order matters: a secret set in Vercel before Vapi sends it rejects live quotes, and the new prompt on the live assistant breaks live calls.

## 1. Before deploying

- [ ] In Base44, check `voice_enabled` is off on any service the phone shouldn't offer. `/api/catalog-health` shows the value per service and the `service_list` text the agent will see.
- [ ] Merge the code and deploy to both Vercel projects. With `VAPI_SERVER_SECRET` unset, live calls carry on working and the routes log a warning.
- [ ] Once deployed, change the soffits row in Base44 from `per_unit` to `per_lm`, then make one test quote to see how "linear m" looks in the CRM. Until this is done, the agent asks soffit callers for a number of items instead of a length, and the number they give sets the price.

## 2. Make a copy of the assistant

The new prompt uses `{{service_list}}`, which only gets filled in for calls that come through `/api/vapi-assistant`. On the main number's fixed assistant, the agent would see the placeholder instead of any services.

- [ ] Duplicate the live assistant in Vapi.
- [ ] Paste `system-prompt.updated.md` onto the **copy** only.
- [ ] Note the copy's assistant id.

## 3. send_quote tool

This tool is shared with the live assistant. These changes are safe for the old prompt too.

- [ ] Remove any enum on service names.
- [ ] Make `customerEmail` optional. The backend asks for it when a quote is ready to go.
- [ ] Describe `service` as: "Exact name from the service list."
- [ ] Describe `quantity` as: "The measurement for this service: area in m², length in linear metres, or a count, hours or days. For a fixed-price service, how many jobs; leave it out if one. Never an area or sheet count on a fixed-price service."

## 4. Secret and environment variables

- [ ] Generate a long random secret.
- [ ] Add it on the send_quote tool's server settings, so requests carry an `x-vapi-secret` header. If Vapi offers credentials rather than a secret field, create a Bearer Token credential with the header name `X-VAPI-SECRET` and the Bearer prefix turned off. The backend checks that header only, so a plain `Authorization` header would get a 401.
- [ ] Set up the same secret for the test number's server URL in step 5.
- [ ] Vercel, asbestosteams: add `VAPI_ASSISTANT_ID` (the copy's id) and `VAPI_SERVER_SECRET`.
- [ ] Vercel, oxfordasbestosabatement: add `VAPI_SERVER_SECRET` as well. The same routes are deployed there, and without a secret anyone can post to its `/api/voice-quote`.
- [ ] Redeploy both projects, as env changes only apply to a new deployment.

Check the routes before involving a phone. Replace `<secret>` with the real value:

```
curl -i -X POST https://asbestosteams.co.uk/api/vapi-assistant \
  -H 'Content-Type: application/json' \
  -H 'x-vapi-secret: <secret>' \
  -d '{"message":{"type":"assistant-request"}}'
```

- [ ] This returns 200 directly with the `assistantId` and `service_list`, not a redirect. If it redirects, use the final URL in Vapi.
- [ ] The same request without the header returns 401.

`check_office_hours` has no secret check. It's read-only and only returns the opening state, so nothing is needed there.

## 5. Test number

- [ ] On a **test** phone number: remove the fixed assistant.
- [ ] Set its server URL to `https://asbestosteams.co.uk/api/vapi-assistant`, with the secret from step 4.
- [ ] Make the test calls below.
- [ ] In the logs, look for `[vapi-assistant] catalog=base44` or `catalog=cache`. `snapshot` or `stale-cache` means Base44 didn't answer in time.

Quotes are only given outside office hours (Monday to Saturday, 08:00 to 17:00 UK), so make the pricing calls after that. Each one really creates and sends a CRM quote, so use your own email address and delete the test records afterwards.

| Call | Expected |
|---|---|
| 3 corrugated sheets | £420 including VAT |
| Artex, without giving the area | Asks for the area, then quotes. No CRM lead until then |
| A listed service plus something unlisted | Quote for the listed one; told the team will call about the other; a lead lists it |
| 2 water tanks | £1,560 including VAT (£1,300 + VAT) |
| 4 water tanks | No price; team callback, with the quantity on the lead |
| "My garage roof" | Asks single or double, rather than guessing |
| A new service added in Base44 | Offered within about 5 minutes, without a code or prompt edit |
| A service with `voice_enabled` off, such as a full roof replacement | Not offered; team callback |
| "I need a survey", while surveys are off | No price; team callback |
| "I already have a survey report" | Asked to email it to sales@asbestosukteams.co.uk |
| Soffits, after the `per_lm` change | Asks for the length in linear metres |
| During office hours | No price; team callback |

## 6. Main number

Only once the test calls pass:

- [ ] Point the main number at the same server URL and secret, and remove its fixed assistant.
- [ ] Make one real call to confirm it connects.
- [ ] Keep the old assistant until you're happy, as switching back is the rollback.

## Vapi details to confirm

These came from search results rather than the full docs:

- `assistant-request` must be answered within 7.5 seconds, and the dashboard's timeout setting doesn't apply to it.
- The response has `assistantId` and `assistantOverrides.variableValues` at the top level. An `error` field is spoken to the caller, and the backend uses it if `VAPI_ASSISTANT_ID` is missing.
- A phone number's server URL may be set as `serverUrl` or `server.url` depending on the API version. The dashboard handles this for you.
