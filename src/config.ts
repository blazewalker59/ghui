import { Config, Effect } from "effect"

const positiveIntOr = (fallback: number) => (value: number) => Number.isFinite(value) && value > 0 ? value : fallback
const parseBoolean = (value: string | undefined, fallback: boolean) => {
	const normalized = value?.trim().toLowerCase()
	if (normalized === undefined || normalized.length === 0) return fallback
	if (["1", "true", "yes", "on"].includes(normalized)) return true
	if (["0", "false", "no", "off"].includes(normalized)) return false
	return fallback
}

const booleanConfig = (name: string, fallback: boolean) => Config.string(name).pipe(
	Config.withDefault(String(fallback)),
	Config.map((value) => parseBoolean(value, fallback)),
)

const appConfig = Config.all({
	author: Config.string("GHUI_AUTHOR").pipe(
		Config.withDefault("@me"),
		Config.map((value) => value.trim() || "@me"),
	),
	prFetchLimit: Config.int("GHUI_PR_FETCH_LIMIT").pipe(
		Config.withDefault(200),
		Config.map(positiveIntOr(200)),
	),
	includeReviewRequested: booleanConfig("GHUI_INCLUDE_REVIEW_REQUESTED", false),
	includeOrganizationPullRequests: booleanConfig("GHUI_INCLUDE_ORG_PRS", false),
	showPullRequestSource: booleanConfig("GHUI_SHOW_PR_SOURCE", false),
	groupByOrg: booleanConfig("GHUI_GROUP_BY_ORG", false),
})

export const config = Effect.runSync(Effect.gen(function*() {
	return yield* appConfig
}))
