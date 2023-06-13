import "../../styles/style.css";
import { gql, useQuery, useSubscription } from "@apollo/client";
import { useState, useEffect } from "react";
// import { useQueryWithSubscription } from "../../utils/useQueryWithSubscription";

const GET_INITIAL_MATCH_HISTORY = gql`
	query getInitialMatchHistory($userId: String!) {
		getInitialMatchHistory(userId: $userId) {
			id
			players {
				id
				username
				avatar
			}
			p1Score
			p2Score
			isFinished
		}
	}
`;

const MATCH_HISTORY_CHANGED = gql`
	subscription matchHistoryHasBeenUpdated($userId: String!) {
		matchHistoryHasBeenUpdated(userId: $userId) {
			id
			players {
				id
				username
				avatar
			}
			p1Score
			p2Score
			isFinished
		}
	}
`;

function MatchHistory({ userId }: { userId: string }) {
	const [matches, setMatches] = useState([]);
	const { data: subData } = useSubscription(MATCH_HISTORY_CHANGED, {
		variables: { userId },
	});
	const {
		data: queryData,
		loading: queryLoading,
		error: queryError,
	} = useQuery(GET_INITIAL_MATCH_HISTORY, { variables: { userId } });

	useEffect(() => {
		if (queryData) setMatches(queryData.getInitialMatchHistory);
	}, [queryData]);

	useEffect(() => {
		if (subData) setMatches(subData.matchHistoryHasBeenUpdated);
	}, [subData]);

	if (queryLoading) return <div> Loading </div>;
	if (queryError) return <div> Error </div>;
	return (
		<div className="stat_block">
			<h2>Match history</h2>
			<table className="match_history">
				<tbody>
					{matches.map((match: any) => (
						<tr key={match.id}>
							<td className="td_ava">
								<img className="match_avatar" src={match.players[0]?.avatar} />
							</td>

							<td className="td_name">{match.players[0]?.username}</td>

							<td className="td_score align_right">
								<h4>{match.p1Score}</h4>
							</td>

							<td className="td_score align_right">
								<h4>{match.p2Score}</h4>
							</td>

							<td className="td_name align_right">{match.players[1]?.username}</td>

							<td className="td_ava">
								<img className="match_avatar" src={match.players[1]?.avatar} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default MatchHistory;
