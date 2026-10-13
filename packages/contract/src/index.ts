import { adminContract } from "./admin";
import { hackathonsContract } from "./hackathons";
import { healthContract } from "./health";
import { membersContract } from "./members";
import { questionsContract } from "./questions";

export * from "./admin";
export * from "./base";
export * from "./consent";
export * from "./hackathons";
export * from "./members";
export * from "./questions";

export const contract = {
	admin: adminContract,
	health: healthContract,
	hackathons: hackathonsContract,
	members: membersContract,
	questions: questionsContract,
};
