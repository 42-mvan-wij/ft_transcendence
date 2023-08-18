import "../../styles/style.css";
import { gql, useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

const GET_STATS = gql`
	query getStats($userId: String!) {
		getStats(userId: $userId) {
			rank
			wins
			losses
			score
		}
	}
`;

const UPDATE_STATS = gql`
	subscription StatsHaveBeenUpdated {
		statsHaveBeenUpdated {
			rank
			wins
			losses
			score
		}
	}
`;

interface Rank {
	rank: number;
	wins: number;
	losses: number;
	score: number;
}

function Stats({ userId }: { userId: string }) {
	const [stats, setStats] = useState<Rank | undefined>();
	const { data, loading, error, subscribeToMore } = useQuery(GET_STATS, {
		variables: { userId },
	});

	useEffect(() => {
		return subscribeToMore({
			document: UPDATE_STATS,
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData.data) return prev;
				return { getStats: subscriptionData.data.statsHaveBeenUpdated };
			},
		});
	});

	useEffect(() => {
		if (data) setStats(data.getStats);
	}, [data]);

	if (loading) return <div> Loading </div>;
	if (!stats) return <></>;
	if (error) return <></>;
	return (
		<div className="stat_block">
			<h2>Stats</h2>
			<table>
				<tbody>
					<tr>
						<td>Ranking</td>
						<td className="align_right">{stats.rank}</td>
						<td></td>
						<td>Wins</td>
						<td className="align_right">{stats.wins}</td>
					</tr>
					<tr>
						<td>Score</td>
						<td className="align_right">{stats.score}</td>
						<td></td>
						<td>Losses</td>
						<td className="align_right">{stats.losses}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

export default Stats;
