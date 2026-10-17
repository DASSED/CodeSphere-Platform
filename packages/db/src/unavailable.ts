/**
 * The database cannot serve the request: none is configured for this deployment (map #86). Answered as SERVICE_UNAVAILABLE, not as an internal
 * error, so a missing database is not reported as a bug.
 */
export class DatabaseUnavailableError extends Error {
	constructor(message = "no database configured for this deployment") {
		super(message);
		this.name = "DatabaseUnavailableError";
	}
}
