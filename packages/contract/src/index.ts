import { hackathonsContract } from "./hackathons";
import { healthContract } from "./health";

export * from "./base";
export * from "./hackathons";

export const contract = {
	health: healthContract,
	hackathons: hackathonsContract,
};
