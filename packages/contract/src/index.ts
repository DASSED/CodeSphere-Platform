import { hackathonsContract } from "./hackathons";
import { healthContract } from "./health";
import { membersContract } from "./members";

export * from "./base";
export * from "./hackathons";
export * from "./members";

export const contract = {
	health: healthContract,
	hackathons: hackathonsContract,
	members: membersContract,
};
