## Plan: Backend Removal Alternatives

Goal: remove Docker/Python backend while keeping main site + admin panel + contact form with simple submission storage and export. We will map current frontend dependencies on the Flask API, then choose a replacement: (A) PocketBase on your DigitalOcean droplet for a lightweight self-hosted CMS + auth + admin UI, (B) a managed headless CMS/Supabase for lower ops but recurring costs, or (C) a form-only service with a slimmer admin experience (if you are willing to drop parts of the admin panel). The plan focuses on migrating contact submissions and admin auth, and cleanly detaching the site from the Flask endpoints.

**Steps**
1. Inventory all frontend dependencies on the backend in [js/admin.js](js/admin.js), [js/contact.js](js/contact.js), and [js/app.js](js/app.js) and categorize endpoints by feature: auth, contact CRUD, badge count, profile, and system controls.
2. Decide on a replacement option and scope for system controls currently in the API: keep them (requires some backend) or remove them from the admin UI. Identify any admin-only pages or UI flows that must remain functional.
3. For the chosen backend:
   - PocketBase: design collections for contacts and users, map auth + list/export features, and define minimal API endpoints to replace current calls.
   - Managed CMS/Supabase: choose service, define tables/collections and auth roles, and update frontend calls to the service SDK or REST endpoints.
   - Form-only service: replace contact submission and remove or stub admin pages; add a lightweight export mechanism via the service dashboard.
4. Update frontend code to point to the new backend endpoints or SDK and adjust error/success handling in [js/contact.js](js/contact.js) and [js/admin.js](js/admin.js). Remove legacy API base logic in [js/app.js](js/app.js) if it no longer applies.
5. Remove Docker/Python artifacts and update deployment instructions in [SYSTEM_MANUAL.md](SYSTEM_MANUAL.md).

**Verification**
- Manual: contact form submits and stores a record, admin login works, contacts list loads, delete/export works.
- If PocketBase or other backend is used: validate auth flows and permissions for list/delete.
- Confirm site loads without any `/api/` calls failing in the browser network tab.

**Decisions**
- Backend replacement: PocketBase self-hosted vs managed headless CMS vs form-only service.
- System controls: keep (needs backend) or remove from admin UI.
