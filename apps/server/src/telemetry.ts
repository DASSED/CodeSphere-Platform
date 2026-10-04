import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { ORPCInstrumentation } from "@orpc/opentelemetry";

import { ENV } from "./env.server";

/**
 * Traces every oRPC call (RPC, OpenAPI and MCP handlers) plus each middleware.
 * Opt-in: without OTEL_EXPORTER_OTLP_ENDPOINT nothing is registered and oRPC's tracing stays a no-op.
 * Hono is not instrumented, so oRPC's own propagation (default) stays on.
 */
export function startTelemetry(): (() => Promise<void>) | undefined {
	if (!ENV.OTEL_EXPORTER_OTLP_ENDPOINT) {
		return undefined;
	}

	const provider = new NodeTracerProvider({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: ENV.OTEL_SERVICE_NAME,
		}),
		spanProcessors: [
			new BatchSpanProcessor(
				new OTLPTraceExporter({
					url: `${ENV.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/traces`,
					headers: parseHeaders(ENV.OTEL_EXPORTER_OTLP_HEADERS),
				}),
			),
		],
	});
	provider.register();
	registerInstrumentations({
		tracerProvider: provider,
		instrumentations: [new ORPCInstrumentation()],
	});

	return () => provider.shutdown();
}

/** `key=value,key2=value2` (the standard OTEL_EXPORTER_OTLP_HEADERS format). */
function parseHeaders(raw: string | undefined): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const pair of raw?.split(",") ?? []) {
		const index = pair.indexOf("=");
		if (index > 0) {
			headers[pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
		}
	}
	return headers;
}
