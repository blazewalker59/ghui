import { TextAttributes } from "@opentui/core"
import { Fragment } from "react"
import type { PullRequestItem } from "../domain.js"
import { daysOpen } from "../date.js"
import { colors } from "./colors.js"
import { fitCell, PlainLine, SectionTitle, TextLine } from "./primitives.js"
import { checkLabel, isOrgGroups, repoColor, reviewIcon, sourceColor, sourceIcon, statusColor, shortRepoName, type PullRequestGroups } from "./pullRequests.js"

export type LoadStatus = "loading" | "ready" | "error"

const GROUP_ICON = "◆"

const getRowLayout = (contentWidth: number, numberWidth = 6, showPullRequestSource = false) => {
	const sourceWidth = showPullRequestSource ? 1 : 0
	const reviewWidth = 1
	const checkWidth = 6
	const ageWidth = 4
	const spacingWidth = showPullRequestSource ? 4 : 2
	const fixedWidth = sourceWidth + reviewWidth + numberWidth + checkWidth + ageWidth + spacingWidth
	const titleWidth = Math.max(8, contentWidth - fixedWidth)
	return { sourceWidth, reviewWidth, checkWidth, ageWidth, numberWidth, titleWidth }
}

const groupNumberWidth = (pullRequests: readonly PullRequestItem[]) => {
	if (pullRequests.length === 0) return 4
	const maxLen = Math.max(...pullRequests.map((pr) => String(pr.number).length))
	return maxLen + 1
}

const GroupTitle = ({ label, color }: { label: string; color: string }) => (
	<TextLine>
		<span fg={color}>{GROUP_ICON} </span>
		<span fg={color} attributes={TextAttributes.BOLD}>{label}</span>
	</TextLine>
)

const RepoTitle = ({ repository }: { repository: string }) => (
	<TextLine>
		<span fg={colors.muted}>  </span>
		<span fg={repoColor(repository)}>• </span>
		<span fg={repoColor(repository)} attributes={TextAttributes.BOLD}>{shortRepoName(repository)}</span>
	</TextLine>
)

const PullRequestRow = ({
	pullRequest,
	selected,
	contentWidth,
	numWidth,
	showPullRequestSource,
	onSelect,
}: {
	pullRequest: PullRequestItem
	selected: boolean
	contentWidth: number
	numWidth: number
	showPullRequestSource: boolean
	onSelect: () => void
}) => {
	const checkText = checkLabel(pullRequest)?.replace(/^checks\s+/, "") ?? ""
	const ageText = `${daysOpen(pullRequest.createdAt)}d`
	const { sourceWidth, reviewWidth, checkWidth, ageWidth, numberWidth, titleWidth } = getRowLayout(contentWidth, numWidth, showPullRequestSource)
	const rowWidth = sourceWidth + reviewWidth + numberWidth + titleWidth + checkWidth + ageWidth + (showPullRequestSource ? 4 : 2)
	const fillerWidth = Math.max(0, contentWidth - rowWidth)
	const indicatorColor = pullRequest.autoMergeEnabled ? colors.accent : statusColor(pullRequest.reviewStatus)

	return (
		<box height={1} onMouseDown={onSelect}>
			<TextLine fg={selected ? colors.selectedText : colors.text} bg={selected ? colors.selectedBg : undefined}>
				{showPullRequestSource ? (
					<>
						<span fg={sourceColor(pullRequest.source)}>{fitCell(sourceIcon(pullRequest.source), sourceWidth)}</span>
						<span> </span>
					</>
				) : null}
				<span fg={indicatorColor}>{fitCell(reviewIcon(pullRequest), reviewWidth)}</span>
				<span> </span>
				<span fg={selected ? colors.accent : colors.count}>{fitCell(`#${pullRequest.number}`, numberWidth, "right")}</span>
				<span> </span>
				<span>{fitCell(pullRequest.title, titleWidth)}</span>
				<span fg={statusColor(pullRequest.checkStatus)}>{fitCell(checkText, checkWidth, "right")}</span>
				<span fg={colors.muted}>{fitCell(ageText, ageWidth, "right")}</span>
				{fillerWidth > 0 ? <span>{" ".repeat(fillerWidth)}</span> : null}
			</TextLine>
		</box>
	)
}

export const PullRequestList = ({
	groups,
	selectedUrl,
	status,
	error,
	contentWidth,
	filterText,
	showFilterBar,
	isFilterEditing,
	showPullRequestSource,
	onSelectPullRequest,
}: {
	groups: PullRequestGroups
	selectedUrl: string | null
	status: LoadStatus
	error: string | null
	contentWidth: number
	filterText: string
	showFilterBar: boolean
	isFilterEditing: boolean
	showPullRequestSource: boolean
	onSelectPullRequest: (url: string) => void
}) => {
	const itemCount = isOrgGroups(groups)
		? groups.reduce((count, group) => count + group.repositories.reduce((repoCount, repository) => repoCount + repository.pullRequests.length, 0), 0)
		: groups.reduce((count, [, pullRequests]) => count + pullRequests.length, 0)
	const emptyText = filterText.length > 0 ? "- No matching pull requests." : "- No open pull requests."

	return (
		<box flexDirection="column">
			<SectionTitle title="PULL REQUESTS" />
			{showFilterBar ? (
				<TextLine>
					<span fg={colors.count}>/</span>
					<span fg={colors.muted}> </span>
					<span fg={isFilterEditing ? colors.text : colors.count}>{filterText.length > 0 ? filterText : "type to filter..."}</span>
				</TextLine>
			) : null}
			{status === "loading" && itemCount === 0 ? <PlainLine text="- Loading pull requests..." fg={colors.muted} /> : null}
			{status === "error" ? <PlainLine text={`- ${error ?? "Could not load pull requests."}`} fg={colors.error} /> : null}
			{status === "ready" && itemCount === 0 ? <PlainLine text={emptyText} fg={colors.muted} /> : null}
			{isOrgGroups(groups)
				? groups.map((group) => (
					<Fragment key={group.organization}>
						<box flexDirection="column">
							<GroupTitle label={group.organization} color={colors.accent} />
							{group.repositories.map((repository) => {
								const numWidth = groupNumberWidth(repository.pullRequests)
								return (
									<box key={repository.repository} flexDirection="column">
										<RepoTitle repository={repository.repository} />
										{repository.pullRequests.map((pullRequest) => (
											<PullRequestRow
												key={pullRequest.url}
												pullRequest={pullRequest}
												selected={pullRequest.url === selectedUrl}
												contentWidth={contentWidth}
												numWidth={numWidth}
												showPullRequestSource={showPullRequestSource}
												onSelect={() => onSelectPullRequest(pullRequest.url)}
											/>
										))}
									</box>
								)
							})}
						</box>
					</Fragment>
				))
				: groups.map(([repo, pullRequests]) => {
					const numWidth = groupNumberWidth(pullRequests)
					return (
						<box key={repo} flexDirection="column">
							<GroupTitle label={repo} color={repoColor(repo)} />
							{pullRequests.map((pullRequest) => (
								<PullRequestRow
									key={pullRequest.url}
									pullRequest={pullRequest}
									selected={pullRequest.url === selectedUrl}
									contentWidth={contentWidth}
									numWidth={numWidth}
									showPullRequestSource={showPullRequestSource}
									onSelect={() => onSelectPullRequest(pullRequest.url)}
								/>
							))}
						</box>
					)
				})}
		</box>
	)
}
