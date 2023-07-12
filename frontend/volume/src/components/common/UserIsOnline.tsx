import { gql, useMutation } from "@apollo/client";
import { useEffect } from "react";

const USER_IS_ONLINE = gql`
	mutation Mutation {
		userIsOnline
	}
`;

export default function UserIsOnline() {
	const [user_is_online, { data, loading, error }] = useMutation(USER_IS_ONLINE);
	const USER_ONLINE_STATUS_TIME_OUT = 5000;

	useEffect(() => {
		const interval = setInterval(() => {
			user_is_online();
		}, USER_ONLINE_STATUS_TIME_OUT);
		return () => clearInterval(interval);
	}, []);
	return;
}
