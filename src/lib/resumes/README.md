# Resume processing pipeline

The upload action validates and stores the private PDF, then records the resume.
The processing action claims the record, downloads the PDF once, and performs a
single local PDF.js pass for text plus link annotations.

Readable, complete text between 120 and 80,000 characters is sent to Gemini.
Empty, partial, garbled, unusually large, or otherwise unusable text keeps the
existing full-PDF Gemini path. Local parsing errors are logged safely and also
fall back to the full PDF; they never fail a previously compatible resume.

Annotation and visible URLs are restricted to external HTTP(S) targets,
classified into the frozen `LinkType` union, and normalized before merging.
Deterministic links are merged first, so missing Gemini links cannot erase PDF
evidence. Application IDs continue to be generated during normalization.

Gemini models remain ordered and sequential. Each model gets up to 30 seconds,
while both the initial structured-output request and its one schema repair share
one 120-second overall budget. Only transient availability/capacity errors and
local per-attempt timeouts advance to the next model. Authentication, request,
and ordinary quota failures stop immediately. The application passes a fresh
AbortSignal for every model and also sets the Gemini SDK HTTP timeout to the
same limit with SDK retries disabled, leaving model fallback under application
control. A repair is skipped when less than five seconds of the overall budget
remains.

In development, compare runs through the `[resume-timing]` server log. It emits
only stage names, outcomes, and rounded durations for validation, upload,
download, deterministic parsing, each Gemini attempt, JSON parsing,
normalization, PortfolioData validation, database writes, response preparation,
and total time. Model logs identify the initial/repair phase, attempt number,
model, input mode, result category, and safe duration. It never logs filenames,
storage paths, resume text, URLs, API responses, or credentials.

The client does not poll while its own processing Server Action is pending. A
page reopened on an already-processing record performs a guarded refresh every
three seconds so recovery polling cannot overlap.
