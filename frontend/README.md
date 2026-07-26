
  # Create Base Files

  This is a code bundle for Create Base Files. The original project is available at https://www.figma.com/design/1kZcAN3IycWf81YC2tpCBd/Create-Base-Files.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Organization registrations (CSV-backed)

  After organization sign-in, open Register New Organization from the dashboard.

  The form submits to:

  - POST /api/registrations
  - PUT /api/registrations/:id

  Data is persisted in project CSV:

  - data/organization_registrations.csv

  The donor map reads registrations through:

  - GET /api/registrations

  and renders them as additional map markers and result cards.
  