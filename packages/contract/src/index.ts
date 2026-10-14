import { adminContract } from "./admin";
import { feedContract } from "./feed";
import { hackathonsContract } from "./hackathons";
import { healthContract } from "./health";
import { membersContract } from "./members";
import { questionsContract } from "./questions";
import { tagsContract } from "./tags";

export * from "./admin";
export * from "./base";
export * from "./consent";
export * from "./feed";
export * from "./hackathons";
export * from "./members";
export * from "./questions";
export * from "./roles";
export * from "./tags";

export const contract = {
	admin: adminContract,
	feed: feedContract,
	health: healthContract,
	hackathons: hackathonsContract,
	members: membersContract,
	questions: questionsContract,
	tags: tagsContract,
};
