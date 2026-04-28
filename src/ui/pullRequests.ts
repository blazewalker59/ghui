import type { PullRequestItem, PullRequestLabel } from "../domain.js"
import { colors } from "./colors.js"

export const shortRepoName = (repository: string) => repository.split("/")[1] ?? repository

export const repositoryOwner = (repository: string) => repository.split("/")[0] ?? repository

export const repoColor = (repository: string) => colors.repos[shortRepoName(repository) as keyof typeof colors.repos] ?? colors.repos.default

export const reviewLabel = (pullRequest: PullRequestItem) => {
	if (pullRequest.reviewStatus === "draft") return "draft"
	if (pullRequest.reviewStatus === "approved") return "approved"
	if (pullRequest.reviewStatus === "changes") return "changes"
	if (pullRequest.reviewStatus === "review") return "review"
	return null
}

export const checkLabel = (pullRequest: PullRequestItem) => pullRequest.checkSummary

export const statusColor = (status: PullRequestItem["reviewStatus"] | PullRequestItem["checkStatus"]) => colors.status[status]

export const reviewIcon = (pullRequest: PullRequestItem) => {
	if (pullRequest.autoMergeEnabled) return "↻"
	if (pullRequest.reviewStatus === "draft") return "◌"
	if (pullRequest.reviewStatus === "approved") return "✓"
	if (pullRequest.reviewStatus === "changes") return "!"
	if (pullRequest.reviewStatus === "review") return "◐"
	return "·"
}

export const sourceIcon = (source: PullRequestItem["source"]) => {
	const sourceCount = [source.authored, source.reviewRequested, source.organization].filter(Boolean).length
	if (sourceCount > 1) return "M"
	if (source.authored) return "A"
	if (source.reviewRequested) return "R"
	if (source.organization) return "O"
	return "·"
}

export const sourceLabel = (source: PullRequestItem["source"]) => [
	source.authored ? "authored" : null,
	source.reviewRequested ? "review requested" : null,
	source.organization ? "organization" : null,
].filter((label): label is string => label !== null).join(" + ")

export const sourceColor = (source: PullRequestItem["source"]) => {
	const sourceCount = [source.authored, source.reviewRequested, source.organization].filter(Boolean).length
	if (sourceCount > 1) return colors.accent
	if (source.authored) return colors.count
	if (source.reviewRequested) return colors.repos.default
	if (source.organization) return colors.muted
	return colors.muted
}

export interface PullRequestRepoGroup {
	readonly repository: string
	readonly pullRequests: readonly PullRequestItem[]
}

export interface PullRequestOrgGroup {
	readonly organization: string
	readonly repositories: readonly PullRequestRepoGroup[]
}

export type PullRequestGroups = Array<[string, PullRequestItem[]]> | readonly PullRequestOrgGroup[]

export const isOrgGroups = (groups: PullRequestGroups): groups is readonly PullRequestOrgGroup[] => {
	const first = groups[0]
	return first !== undefined && !Array.isArray(first)
}

export const groupPullRequestsByOrg = (pullRequests: readonly PullRequestItem[]): readonly PullRequestOrgGroup[] => {
	const organizations = new Map<string, Map<string, PullRequestItem[]>>()

	for (const pullRequest of pullRequests) {
		const organization = repositoryOwner(pullRequest.repository)
		const repositories = organizations.get(organization) ?? new Map<string, PullRequestItem[]>()
		const repositoryPullRequests = repositories.get(pullRequest.repository) ?? []
		repositoryPullRequests.push(pullRequest)
		repositories.set(pullRequest.repository, repositoryPullRequests)
		organizations.set(organization, repositories)
	}

	return [...organizations.entries()]
		.sort((left, right) => left[0].localeCompare(right[0]))
		.map(([organization, repositories]) => ({
			organization,
			repositories: [...repositories.entries()]
				.sort((left, right) => shortRepoName(left[0]).localeCompare(shortRepoName(right[0])))
				.map(([repository, repositoryPullRequests]) => ({
					repository,
					pullRequests: repositoryPullRequests,
				})),
		}))
}

const fallbackLabelColor = (name: string) => {
	let hash = 0
	for (const char of name) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0
	}
	const hue = hash % 360
	return `hsl(${hue} 55% 35%)`
}

export const labelColor = (label: PullRequestLabel) => label.color ?? fallbackLabelColor(label.name)

export const labelTextColor = (color: string) => {
	if (color.startsWith("#") && color.length === 7) {
		const red = Number.parseInt(color.slice(1, 3), 16)
		const green = Number.parseInt(color.slice(3, 5), 16)
		const blue = Number.parseInt(color.slice(5, 7), 16)
		const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
		return luminance > 0.6 ? "#111111" : "#f8fafc"
	}
	return "#f8fafc"
}

export const groupBy = <T,>(items: readonly T[], getKey: (item: T) => string, orderedKeys: readonly string[] = []) => {
	const groups = new Map<string, T[]>()
	for (const item of items) {
		const key = getKey(item)
		const existing = groups.get(key)
		if (existing) {
			existing.push(item)
		} else {
			groups.set(key, [item])
		}
	}

	const order = new Map(orderedKeys.map((key, index) => [key, index]))
	return [...groups.entries()].sort((left, right) => {
		const leftIndex = order.get(left[0])
		const rightIndex = order.get(right[0])
		if (leftIndex !== undefined && rightIndex !== undefined) return leftIndex - rightIndex
		if (leftIndex !== undefined) return -1
		if (rightIndex !== undefined) return 1
		return left[0].localeCompare(right[0])
	})
}
