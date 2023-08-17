import "src/styles/style.css";
import * as i from "src/types/Interfaces";
import { useEffect } from "react";
import { convertEncodedImage } from "src/utils/convertEncodedImage";
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";

const GET_WHOLE_QUEUE = gql`
	query getWholeQueue {
		getWholeQueue {
			id
			p1 {
				id
				username
				avatar {
					file
				}
			}
			p2 {
				id
				username
				avatar {
					file
				}
			}
		}
	}
`;

const CURRENT_USER = gql`
	query currentUserQuery {
		currentUserQuery {
			id
			username
			avatar {
				file
			}
		}
	}
`;

const JOIN_QUEUE = gql`
	mutation joinQueue {
		joinQueue
	}
`;

const QUEUE_CHANGED = gql`
	subscription queueChanged {
		queueChanged {
			id
			p1 {
				id
				username
				avatar {
					file
				}
			}
			p2 {
				id
				username
				avatar {
					file
				}
			}
		}
	}
`;

const GET_QUEUE_AVAILABILITY = gql`
	query {
		getQueueAvailability {
			queueStatus
		}
	}
`;

const QUEUE_AVAILABILITY_CHANGED = gql`
	subscription queueAvailabilityChanged($userId: String!) {
		queueAvailabilityChanged(userId: $userId) {
			queueStatus
		}
	}
`;

enum QueueStatus {
	CAN_JOIN,
	IN_MATCH,
	IN_QUEUE,
}

export default function Queue(props: i.ModalProps) {
	const {
		data: queue_data,
		loading: queue_loading,
		error: queue_error,
		subscribeToMore,
	} = useQuery(GET_WHOLE_QUEUE);

	useEffect(() => {
		return subscribeToMore({
			document: QUEUE_CHANGED,
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData.data) return prev;
				const newQueue = subscriptionData.data.queueChanged;
				return Object.assign({}, prev, {
					getWholeQueue: newQueue,
				});
			},
		});
	}, []);

	if (queue_loading) return <h3 className="queueMessage"> Loading queue </h3>;
	if (queue_error) return <div> Queue error </div>;
	return (
		<>
			<RemovedFromQueue />
			<RemovedMatch />
			<JoinQueueElement />
			{queue_data.getWholeQueue.map(function (game: any) {
				return (
					<div className="flex_row_spacebetween" key={game.id}>
						<div
							className="player player--one"
							onClick={() =>
								props.toggleModal({
									type: "UserStats",
									selectedUser: game.p1,
								})
							}
						>
							<h3 className="name">{game.p1.username}</h3>
							<div className="avatar_container">
								<img src={convertEncodedImage(game.p1.avatar.file)} />
							</div>
						</div>

						<div
							className="player player--two"
							onClick={() =>
								props.toggleModal({
									type: "UserStats",
									selectedUser: game.p2,
								})
							}
						>
							<div className="avatar_container">
								<img src={convertEncodedImage(game.p2.avatar.file)} />
							</div>
							<h3 className="name">{game.p2.username}</h3>
						</div>
					</div>
				);
			})}
		</>
	);
}

function JoinQueueElement() {
	const [joinQueue, { loading: queue_loading, error: queue_error }] = useMutation(JOIN_QUEUE);
	const { data: user_data, loading: user_loading, error: user_error } = useQuery(CURRENT_USER);
	const { data: queue_availability, subscribeToMore } = useQuery(GET_QUEUE_AVAILABILITY);

	useEffect(() => {
		if (!user_data?.currentUserQuery) return;
		return subscribeToMore({
			document: QUEUE_AVAILABILITY_CHANGED,
			variables: { userId: user_data.currentUserQuery.id },
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData.data) return prev;
				return Object.assign({}, prev, {
					getQueueAvailability: subscriptionData.data.queueAvailabilityChanged,
				});
			},
		});
	}, [user_data]);

	if (user_loading) return <h3 className="queueMessage">Loading user</h3>;
	if (user_error) return <>error loading user</>;

	const handleClick = (event: any) => {
		event.preventDefault();
		joinQueue();
	};

	if (queue_loading) return <h3 className="queueMessage">Loading queue...</h3>;
	if (queue_error) return <>error joining queue</>;
	if (queue_availability?.getQueueAvailability.queueStatus === QueueStatus.CAN_JOIN) {
		return (
			<form onSubmit={handleClick}>
				<button type="submit">Join queue</button>
			</form>
		);
	}
	if (queue_availability?.getQueueAvailability.queueStatus === QueueStatus.IN_QUEUE) {
		return <h3 className="queueMessage">You've joined the queue </h3>;
	}
	return <></>;
}

const REMOVED_FROM_QUEUE = gql`
	subscription RemovedFromQueue {
		removedFromQueue
	}
`;

function RemovedFromQueue() {
	const { data: removed_from_queue } = useSubscription(REMOVED_FROM_QUEUE);

	useEffect(() => {
		if (removed_from_queue) alert("Opponent gave up. You have been removed from the queue");
	}, [removed_from_queue]);

	return <></>;
}

const REMOVED_FROM_MATCH = gql`
	subscription removedMatch {
		removedMatch
	}
`;

function RemovedMatch() {
	const { data: removed_from_match_data } = useSubscription(REMOVED_FROM_MATCH);

	useEffect(() => {
		if (removed_from_match_data) alert("Opponent gave up. You have won the match!");
	}, [removed_from_match_data]);

	return <></>;
}
