export {
	CodeBlock,
	type CodeBlockProps,
	CompactCodeBlock,
	type CompactCodeBlockProps,
} from "@codesphere/ui/components/molecules/code-block/code-block";
// Language utilities
export {
	getLanguage,
	languages,
	normalizeLanguage,
} from "@codesphere/ui/components/molecules/code-block/languages";
// Styles (for customization)
export {
	getTokenStyle,
	tokenStyles,
} from "@codesphere/ui/components/molecules/code-block/styles";

// Tokenizer (for advanced usage)
export { tokenize } from "@codesphere/ui/components/molecules/code-block/tokenizer";
// Types
export type {
	LanguageDefinition,
	Token,
	TokenType,
} from "@codesphere/ui/components/molecules/code-block/types";
