/**
 * Various settings for generating release notes.
 */
export interface GeneratorSettings {
	ownerName: string;
	repoName: string;
	githubTokenEnvVarName: string;
	milestoneName: string;
	headerText: string;
	wordReplacements: Record<string, string>;
	version?: string;
	releaseType?: string;
	extraInfo?: { title: string; text: string };
	emojisToRemoveFromTitle?: string[];
	issueCategoryLabelMappings?: Record<string, string>;
	prCategoryLabelMappings?: Record<string, string>;
	ignoreLabels?: string[];
	firstWordReplacements?: Record<string, string>;
	styleWordsList?: Record<string, string>;
	boldedVersions?: boolean;
	italicVersions?: boolean;
	otherCategoryName?: string;
}
