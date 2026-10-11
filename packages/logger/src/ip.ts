// The client IP is personal data (spec §4): logs keep only a truncated form, enough to spot
// abuse from a network without identifying a person. IPv4 keeps /24, IPv6 keeps /48.
export function truncateIp(ip: string | undefined): string | undefined {
	if (!ip) {
		return undefined;
	}
	const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
	const address = mapped?.[1] ?? ip;
	if (address.includes(".")) {
		const octets = address.split(".");
		return [...octets.slice(0, 3), "0"].join(".");
	}
	return `${expandIpv6(address.split("%")[0] ?? "")
		.slice(0, 3)
		.join(":")}::`;
}

// Eight groups, `::` filled with zeros, leading zeros dropped: "2001::1" → 2001,0,0,0,0,0,0,1.
function expandIpv6(address: string): string[] {
	const [head = "", tail] = address.split("::");
	const left = head ? head.split(":") : [];
	const right = tail ? tail.split(":") : [];
	const zeros =
		tail === undefined ? [] : Array(8 - left.length - right.length).fill("0");
	return [...left, ...zeros, ...right].map((group) =>
		Number.parseInt(group || "0", 16).toString(16),
	);
}
