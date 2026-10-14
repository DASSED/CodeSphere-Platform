import { adminContract } from "./admin";
import { answersContract } from "./answers";
import { feedContract } from "./feed";
import { hackathonsContract } from "./hackathons";
import { healthContract } from "./health";
import { membersContract } from "./members";
import { questionsContract } from "./questions";
import { tagsContract } from "./tags";
import { votesContract } from "./votes";

export * from "./admin";
export * from "./answers";
export * from "./base";
export * from "./consent";
export * from "./feed";
export * from "./hackathons";
export * from "./members";
export * from "./questions";
export * from "./roles";
export * from "./tags";
export * from "./votes";

export const contract = {
	admin: adminContract,
	answers: answersContract,
	feed: feedContract,
	health: healthContract,
	hackathons: hackathonsContract,
	members: membersContract,
	questions: questionsContract,
	tags: tagsContract,
	votes: votesContract,
};
