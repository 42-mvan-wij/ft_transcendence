import { gql, useMutation } from "@apollo/client";
import { useEffect } from "react";

const USER_ONLINE_CHECK = 4000;

const USER_IS_ONLINE = gql`
	mutation Mutation {
		userIsOnline
	}
`;

export default function UserIsOnline() {
	const [user_is_online, { data, loading, error }] = useMutation(USER_IS_ONLINE);

	useEffect(() => {
		const interval = setInterval(() => {
			user_is_online();
		}, USER_ONLINE_CHECK);
		return () => clearInterval(interval);
	}, []);
	return;
}
